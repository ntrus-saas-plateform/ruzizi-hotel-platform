# Production Deployment Guide - Ruzizi Hotel Platform

## Overview

This comprehensive guide provides step-by-step instructions for deploying the enhanced Ruzizi Hotel Platform to production on Linode (Akamai Connected Cloud) with MongoDB Atlas, custom domain, SSL certificates, and built-in monitoring.

## Table of Contents

1. [Pre-Deployment Preparation](#1-pre-deployment-preparation)
2. [Environment Setup](#2-environment-setup)
3. [CI/CD Pipeline Setup](#3-cicd-pipeline-setup)
4. [Build and Deployment Process](#4-build-and-deployment-process)
5. [Database Setup and Migration](#5-database-setup-and-migration)
6. [Security Configuration](#6-security-configuration)
7. [Monitoring and Logging](#7-monitoring-and-logging)
8. [Backup and Disaster Recovery](#8-backup-and-disaster-recovery)
9. [Post-Deployment Verification](#9-post-deployment-verification)
10. [Scaling Considerations](#10-scaling-considerations)
11. [Troubleshooting](#11-troubleshooting)

## 1. Pre-Deployment Preparation

### Prerequisites Checklist

- [ ] **Linode Account**: Active account with sufficient credits
- [ ] **MongoDB Atlas**: Database cluster created and accessible
- [ ] **Domain Name**: Registered domain with DNS access
- [ ] **SSL Certificate**: Let's Encrypt or purchased certificate
- [ ] **Email Service**: SMTP configuration for notifications
- [ ] **Git Repository**: Code repository with deployment access
- [ ] **Environment Variables**: All production secrets prepared
- [ ] **Security Review**: Code security audit completed
- [ ] **Performance Testing**: Load testing completed
- [ ] **Backup Strategy**: Data backup procedures documented

### Required Linode Resources

```bash
# Recommended Linode specifications for production
Instance Type: Dedicated CPU (4GB RAM minimum)
Region: Select based on target audience (e.g., eu-west for Europe)
Image: Ubuntu 22.04 LTS
Storage: 50GB minimum (SSD)
Backups: Enabled
```

### Required Software Versions

- Node.js: 18.x LTS
- MongoDB: 6.0+ (Atlas)
- Redis: 7.x (optional, for caching)
- Nginx: Latest stable
- Docker: 24.x+ (optional, for containerized deployment)

## 2. Environment Setup

### Linode Instance Setup

```bash
# 1. Create Linode instance
# Log into Linode Cloud Manager
# Create new Linode with specifications above

# 2. Initial server setup
ssh root@your-linode-ip

# Update system
sudo apt update && sudo apt upgrade -y

# Install essential packages
sudo apt install -y curl wget git htop ufw fail2ban

# Configure firewall
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw --force enable

# Create application user
sudo adduser ruzizi
sudo usermod -aG sudo ruzizi
sudo mkdir -p /home/ruzizi/app
sudo chown -R ruzizi:ruzizi /home/ruzizi
```

### Node.js Installation

```bash
# Install Node.js 18.x using NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version

# Install PM2 for process management
sudo npm install -g pm2
```

### MongoDB Atlas Configuration

```bash
# 1. Create MongoDB Atlas cluster
# - Go to https://cloud.mongodb.com
# - Create new project: "ruzizi-hotel-prod"
# - Create cluster (M10 or higher for production)
# - Set region closest to your Linode instance

# 2. Create database user
# - Go to Database Access
# - Add new database user with read/write access
# - Note the username and password

# 3. Configure network access
# - Go to Network Access
# - Add IP address: 0.0.0.0/0 (restrict in production)
# - Or add your Linode's public IP

# 4. Get connection string
# - Go to Clusters > Connect
# - Choose "Connect your application"
# - Copy the connection string
```

### Redis Setup (Optional)

```bash
# Install Redis
sudo apt install redis-server -y

# Configure Redis
sudo systemctl enable redis-server
sudo systemctl start redis-server

# Secure Redis (optional)
sudo nano /etc/redis/redis.conf
# Set: requirepass your-redis-password
# Set: bind 127.0.0.1

sudo systemctl restart redis-server
```

### Nginx Setup

```bash
# Install Nginx
sudo apt install nginx -y

# Create Nginx configuration
sudo nano /etc/nginx/sites-available/ruzizi-hotel

# Add the following configuration:
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    # SSL configuration
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # SSL security settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # Application proxy
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeout settings
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Static files caching
    location /_next/static/ {
        proxy_pass http://localhost:3000;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # API routes
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Enable site
sudo ln -s /etc/nginx/sites-available/ruzizi-hotel /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 3. CI/CD Pipeline Setup

### GitHub Actions Setup

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]
  workflow_dispatch:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run linting
        run: npm run lint

      - name: Run type checking
        run: npm run type-check

      - name: Run tests
        run: npm run test:ci

  build-and-deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build application
        run: npm run build
        env:
          NODE_ENV: production

      - name: Create deployment package
        run: |
          tar -czf ruzizi-hotel-${{ github.sha }}.tar.gz \
            .next \
            public \
            package.json \
            package-lock.json \
            next.config.js

      - name: Deploy to Linode
        uses: appleboy/scp-action@master
        with:
          host: ${{ secrets.LINODE_HOST }}
          username: ${{ secrets.LINODE_USER }}
          key: ${{ secrets.LINODE_SSH_KEY }}
          source: "ruzizi-hotel-${{ github.sha }}.tar.gz"
          target: "/home/ruzizi"

      - name: Execute deployment script
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.LINODE_HOST }}
          username: ${{ secrets.LINODE_USER }}
          key: ${{ secrets.LINODE_SSH_KEY }}
          script: |
            cd /home/ruzizi
            tar -xzf ruzizi-hotel-${{ github.sha }}.tar.gz
            npm ci --production
            pm2 restart ruzizi-hotel || pm2 start npm --name "ruzizi-hotel" -- start
            pm2 save
```

### Environment Variables Setup

Create production environment file:

```bash
# On your Linode server
sudo nano /home/ruzizi/.env.production

# Add the following variables:
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ruzizi_prod?retryWrites=true&w=majority
JWT_SECRET=your-super-secure-jwt-secret
JWT_REFRESH_SECRET=your-super-secure-refresh-secret
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=https://your-domain.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@your-domain.com
FRONTEND_URL=https://your-domain.com
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=your-redis-password
LOG_LEVEL=info
BCRYPT_ROUNDS=12
```

## 4. Build and Deployment Process

### Manual Deployment Process

```bash
# 1. Connect to your Linode server
ssh ruzizi@your-linode-ip

# 2. Navigate to application directory
cd /home/ruzizi/app

# 3. Pull latest changes
git pull origin main

# 4. Install dependencies
npm ci --production

# 5. Build application
npm run build

# 6. Run database migrations (if any)
npm run migrate

# 7. Start/restart application with PM2
pm2 restart ruzizi-hotel || pm2 start npm --name "ruzizi-hotel" -- start

# 8. Save PM2 configuration
pm2 save

# 9. Check application status
pm2 status
pm2 logs ruzizi-hotel
```

### Docker Deployment (Alternative)

```bash
# 1. Install Docker on Linode
sudo apt install docker.io -y
sudo systemctl start docker
sudo usermod -aG docker ruzizi

# 2. Create docker-compose.prod.yml
version: '3.8'

services:
  app:
    image: ruzizi-hotel:latest
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - MONGODB_URI=${MONGODB_URI}
      - JWT_SECRET=${JWT_SECRET}
      # ... other environment variables
    ports:
      - "3000:3000"
    volumes:
      - ./uploads:/app/uploads
      - ./logs:/app/logs
    depends_on:
      - redis

  redis:
    image: redis:7-alpine
    restart: unless-stopped
    command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data

volumes:
  redis_data:

# 3. Deploy with Docker Compose
docker-compose -f docker-compose.prod.yml up -d
```

## 5. Database Setup and Migration

### Initial Database Setup

```bash
# 1. Connect to MongoDB Atlas
mongosh "mongodb+srv://username:password@cluster.mongodb.net/ruzizi_prod"

# 2. Create collections (if needed)
use ruzizi_prod

# 3. Create indexes for performance
db.users.createIndex({ "email": 1 }, { unique: true })
db.establishments.createIndex({ "location": "2dsphere" })
db.bookings.createIndex({ "establishmentId": 1, "checkIn": 1, "checkOut": 1 })
db.bookings.createIndex({ "userId": 1 })

# 4. Seed initial data
npm run seed
```

### Database Migration Strategy

```typescript
// lib/db/migrations.ts
import mongoose from 'mongoose';

export class DatabaseMigration {
  private static migrations: Migration[] = [
    {
      version: 1,
      name: 'add_user_roles',
      up: async () => {
        await mongoose.connection.collection('users').updateMany(
          { role: { $exists: false } },
          { $set: { role: 'staff' } }
        );
      },
      down: async () => {
        await mongoose.connection.collection('users').dropIndex('email_1');
      }
    }
  ];

  static async runMigrations() {
    const currentVersion = await this.getCurrentVersion();

    for (const migration of this.migrations) {
      if (migration.version > currentVersion) {
        console.log(`Running migration: ${migration.name}`);
        await migration.up();
        await this.updateVersion(migration.version);
      }
    }
  }

  private static async getCurrentVersion(): Promise<number> {
    try {
      const doc = await mongoose.connection.collection('migrations').findOne({ _id: 'version' });
      return doc ? doc.version : 0;
    } catch {
      return 0;
    }
  }

  private static async updateVersion(version: number) {
    await mongoose.connection.collection('migrations').updateOne(
      { _id: 'version' },
      { $set: { version } },
      { upsert: true }
    );
  }
}
```

## 6. Security Configuration

### SSL Certificate Setup

```bash
# Install Certbot for Let's Encrypt
sudo apt install certbot python3-certbot-nginx -y

# Obtain SSL certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Set up auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### Security Hardening

```bash
# 1. Configure fail2ban
sudo nano /etc/fail2ban/jail.local

[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
bantime = 3600

# 2. Disable root login
sudo nano /etc/ssh/sshd_config
# Set: PermitRootLogin no
# Set: PasswordAuthentication no

sudo systemctl reload sshd

# 3. Set up log monitoring
sudo apt install logwatch -y

# 4. Configure rate limiting in Nginx
sudo nano /etc/nginx/sites-available/ruzizi-hotel

# Add to server block:
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=auth:10m rate=5r/m;

location /api/ {
    limit_req zone=api burst=20 nodelay;
    # ... other config
}

location /api/auth/ {
    limit_req zone=auth burst=5 nodelay;
    # ... other config
}
```

### Environment Security

```bash
# 1. Use strong secrets
# Generate JWT secrets
openssl rand -hex 32

# 2. Restrict environment file permissions
chmod 600 /home/ruzizi/.env.production

# 3. Use secret management (optional)
# Consider using services like AWS Secrets Manager or HashiCorp Vault

# 4. Database security
# - Use MongoDB Atlas IP whitelisting
# - Enable database authentication
# - Use TLS/SSL for connections
# - Regular security updates
```

## 7. Monitoring and Logging

### Application Monitoring Setup

```typescript
// lib/monitoring/app-monitor.ts
import { PerformanceMonitor } from '@/lib/performance/monitoring';
import winston from 'winston';

export class ApplicationMonitor {
  private logger: winston.Logger;
  private performanceMonitor: PerformanceMonitor;

  constructor() {
    this.setupLogger();
    this.setupPerformanceMonitoring();
    this.setupErrorTracking();
  }

  private setupLogger() {
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      transports: [
        new winston.transports.File({
          filename: 'logs/error.log',
          level: 'error'
        }),
        new winston.transports.File({
          filename: 'logs/combined.log'
        }),
        new winston.transports.Console({
          format: winston.format.simple()
        })
      ]
    });
  }

  private setupPerformanceMonitoring() {
    this.performanceMonitor = new PerformanceMonitor();

    // Monitor key metrics
    setInterval(() => {
      this.logPerformanceMetrics();
    }, 60000); // Every minute
  }

  private setupErrorTracking() {
    process.on('uncaughtException', (error) => {
      this.logger.error('Uncaught Exception', { error: error.message, stack: error.stack });
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      this.logger.error('Unhandled Rejection', { reason, promise });
    });
  }

  private logPerformanceMetrics() {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    this.logger.info('Performance Metrics', {
      memory: {
        rss: memUsage.rss,
        heapTotal: memUsage.heapTotal,
        heapUsed: memUsage.heapUsed,
        external: memUsage.external
      },
      cpu: cpuUsage,
      uptime: process.uptime()
    });
  }

  logRequest(req: any, res: any, responseTime: number) {
    this.logger.info('HTTP Request', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      responseTime,
      userAgent: req.get('User-Agent'),
      ip: req.ip
    });
  }

  logError(error: Error, context?: any) {
    this.logger.error('Application Error', {
      error: error.message,
      stack: error.stack,
      context
    });
  }
}

export const appMonitor = new ApplicationMonitor();
```

### Health Check Endpoints

```typescript
// app/api/health/route.ts
import { NextResponse } from 'next/server';
import mongoose from 'mongoose';

export async function GET() {
  try {
    // Check database connection
    const dbStatus = mongoose.connection.readyState === 1 ? 'healthy' : 'unhealthy';

    // Check Redis connection (if used)
    let redisStatus = 'not_configured';
    if (process.env.REDIS_URL) {
      // Add Redis health check
      redisStatus = 'healthy'; // Implement actual check
    }

    // Check application uptime
    const uptime = process.uptime();

    const health = {
      status: dbStatus === 'healthy' ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime,
      services: {
        database: dbStatus,
        redis: redisStatus
      },
      version: process.env.npm_package_version
    };

    const statusCode = health.status === 'healthy' ? 200 : 503;

    return NextResponse.json(health, { status: statusCode });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Health check failed'
      },
      { status: 503 }
    );
  }
}
```

### Log Rotation and Management

```bash
# Install logrotate
sudo apt install logrotate -y

# Create logrotate configuration
sudo nano /etc/logrotate.d/ruzizi-hotel

# Add:
/home/ruzizi/app/logs/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 ruzizi ruzizi
    postrotate
        pm2 reloadLogs
    endscript
}
```

## 8. Backup and Disaster Recovery

### Database Backup Strategy

```bash
# 1. MongoDB Atlas automated backups
# - Enable continuous backups in Atlas dashboard
# - Set retention period (7-30 days recommended)
# - Schedule point-in-time recovery

# 2. Manual backup script
#!/bin/bash
# backup-mongodb.sh

BACKUP_DIR="/home/ruzizi/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="ruzizi_backup_$DATE"

mkdir -p $BACKUP_DIR

# Create backup using mongodump
mongodump --uri="$MONGODB_URI" --out="$BACKUP_DIR/$BACKUP_NAME"

# Compress backup
tar -czf "$BACKUP_DIR/${BACKUP_NAME}.tar.gz" -C "$BACKUP_DIR" "$BACKUP_NAME"

# Remove uncompressed backup
rm -rf "$BACKUP_DIR/$BACKUP_NAME"

# Keep only last 7 days of backups
find $BACKUP_DIR -name "ruzizi_backup_*.tar.gz" -mtime +7 -delete

echo "Backup completed: $BACKUP_DIR/${BACKUP_NAME}.tar.gz"
```

### Application Backup Strategy

```bash
# 1. File system backups
# - User uploads
# - Configuration files
# - SSL certificates

# 2. Automated backup script
#!/bin/bash
# backup-application.sh

BACKUP_DIR="/home/ruzizi/backups/app"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup uploads directory
tar -czf "$BACKUP_DIR/uploads_$DATE.tar.gz" /home/ruzizi/app/uploads/

# Backup configuration files
tar -czf "$BACKUP_DIR/config_$DATE.tar.gz" \
    /home/ruzizi/.env.production \
    /etc/nginx/sites-available/ruzizi-hotel

# Backup SSL certificates
tar -czf "$BACKUP_DIR/ssl_$DATE.tar.gz" /etc/letsencrypt/

echo "Application backup completed"
```

### Disaster Recovery Plan

```bash
# 1. Server recovery
# - Keep server configuration scripts in version control
# - Document all manual configurations
# - Use infrastructure as code (Terraform/Ansible)

# 2. Database recovery
# - Test backup restoration regularly
# - Document recovery procedures
# - Have multiple backup locations

# 3. Application recovery
# - Keep deployment scripts in repository
# - Use blue-green deployment for zero-downtime updates
# - Have rollback procedures documented
```

## 9. Post-Deployment Verification

### Verification Checklist

- [ ] **Application Accessibility**: Verify site loads on custom domain
- [ ] **HTTPS Configuration**: Confirm SSL certificate is valid
- [ ] **Database Connection**: Verify MongoDB Atlas connection
- [ ] **Authentication**: Test user login/registration
- [ ] **API Endpoints**: Test critical API routes
- [ ] **Email Service**: Verify email notifications work
- [ ] **File Uploads**: Test file upload functionality
- [ ] **Performance**: Check response times and resource usage
- [ ] **Security**: Run security scans and vulnerability checks
- [ ] **Monitoring**: Confirm logging and monitoring are working
- [ ] **Backups**: Verify backup processes are running

### Automated Health Checks

```bash
# Create health check script
#!/bin/bash
# health-check.sh

# Check if application is running
if pm2 describe ruzizi-hotel > /dev/null 2>&1; then
    echo "✓ Application is running"
else
    echo "✗ Application is not running"
    exit 1
fi

# Check HTTP response
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://your-domain.com/api/health)
if [ "$HTTP_STATUS" -eq 200 ]; then
    echo "✓ Health check passed"
else
    echo "✗ Health check failed (Status: $HTTP_STATUS)"
    exit 1
fi

# Check SSL certificate
SSL_EXPIRY=$(openssl s_client -connect your-domain.com:443 -servername your-domain.com 2>/dev/null | openssl x509 -noout -dates | grep notAfter | cut -d= -f2)
SSL_DAYS=$(( ($(date -d "$SSL_EXPIRY" +%s) - $(date +%s)) / 86400 ))
if [ "$SSL_DAYS" -gt 30 ]; then
    echo "✓ SSL certificate valid ($SSL_DAYS days remaining)"
else
    echo "⚠ SSL certificate expires soon ($SSL_DAYS days remaining)"
fi

# Check disk space
DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -lt 80 ]; then
    echo "✓ Disk usage: $DISK_USAGE%"
else
    echo "⚠ High disk usage: $DISK_USAGE%"
fi

echo "Health check completed"
```

## 10. Scaling Considerations

### Horizontal Scaling

```bash
# 1. Load balancer setup with Nginx
upstream ruzizi_app {
    server 127.0.0.1:3000;
    server 127.0.0.1:3001;
    server 127.0.0.1:3002;
}

server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://ruzizi_app;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}

# 2. PM2 clustering
pm2 start npm --name "ruzizi-hotel" -- start -i max
```

### Database Scaling

```javascript
// Connection pooling configuration
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI, {
  maxPoolSize: 10, // Maximum number of connections
  minPoolSize: 2,  // Minimum number of connections
  maxIdleTimeMS: 30000, // Close connections after 30 seconds
  serverSelectionTimeoutMS: 5000, // Timeout for server selection
  socketTimeoutMS: 45000, // Close sockets after 45 seconds
});
```

### Caching Strategy for Scale

```typescript
// Multi-level caching implementation
export class CacheManager {
  private l1Cache: Map<string, any> = new Map(); // In-memory
  private redisClient: any; // Redis

  async get(key: string): Promise<any> {
    // Check L1 cache first
    if (this.l1Cache.has(key)) {
      return this.l1Cache.get(key);
    }

    // Check Redis
    const redisData = await this.redisClient.get(key);
    if (redisData) {
      // Update L1 cache
      this.l1Cache.set(key, JSON.parse(redisData));
      return JSON.parse(redisData);
    }

    return null;
  }

  async set(key: string, value: any, ttl: number = 300): Promise<void> {
    // Set in both caches
    this.l1Cache.set(key, value);
    await this.redisClient.setex(key, ttl, JSON.stringify(value));
  }
}
```

### Performance Optimization

```typescript
// next.config.js optimizations for scale
module.exports = {
  // Enable compression
  compress: true,

  // Optimize images
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
  },

  // Bundle optimization
  webpack: (config, { dev }) => {
    if (!dev) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
        },
      };
    }
    return config;
  },

  // Enable ISR for dynamic content
  experimental: {
    incrementalCacheHandlerPath: require.resolve('./cache-handler.js'),
  },
};
```

## 11. Troubleshooting

### Common Issues and Solutions

#### Application Won't Start

```bash
# Check PM2 status
pm2 status

# Check application logs
pm2 logs ruzizi-hotel

# Check environment variables
cat /home/ruzizi/.env.production

# Verify Node.js version
node --version

# Check dependencies
cd /home/ruzizi/app
npm list --depth=0
```

#### Database Connection Issues

```bash
# Test MongoDB connection
mongosh "mongodb+srv://username:password@cluster.mongodb.net/ruzizi_prod"

# Check network connectivity
telnet cluster.mongodb.net 27017

# Verify connection string
# Ensure username/password are URL-encoded
# Check IP whitelisting in Atlas
```

#### SSL Certificate Problems

```bash
# Check certificate validity
openssl s_client -connect your-domain.com:443 -servername your-domain.com

# Renew certificate
sudo certbot renew

# Check Nginx configuration
sudo nginx -t
sudo systemctl reload nginx
```

#### Performance Issues

```bash
# Check system resources
htop
df -h
free -h

# Monitor application performance
pm2 monit

# Check database performance
# Use MongoDB Atlas monitoring dashboard

# Analyze bundle size
npm run analyze-bundle
```

#### Memory Leaks

```bash
# Monitor memory usage
pm2 monit

# Check for memory leaks
node --inspect --max-old-space-size=4096

# Implement memory monitoring
const memUsage = process.memoryUsage();
console.log(`Memory usage: ${Math.round(memUsage.heapUsed / 1024 / 1024)} MB`);
```

### Emergency Procedures

#### Application Down

```bash
# Quick restart
pm2 restart ruzizi-hotel

# If that doesn't work, rebuild and restart
cd /home/ruzizi/app
npm run build
pm2 restart ruzizi-hotel

# Check system resources
# If server is overloaded, scale up Linode instance
```

#### Database Issues

```bash
# Check Atlas status
# Visit https://status.mongodb.com/

# Restart application (may resolve connection issues)
pm2 restart ruzizi-hotel

# If Atlas is down, wait for service restoration
# Consider failover to backup database if configured
```

#### Security Incident

```bash
# Isolate affected systems
# Change all passwords and API keys
# Review access logs
# Contact security team
# Document incident for post-mortem
```

### Log Analysis

```bash
# Search for errors
grep "ERROR" /home/ruzizi/app/logs/combined.log

# Find slow requests
grep "responseTime.*[0-9]\{4,\}" /home/ruzizi/app/logs/combined.log

# Monitor failed login attempts
grep "login.*failed" /home/ruzizi/app/logs/combined.log

# Analyze traffic patterns
grep "HTTP Request" /home/ruzizi/app/logs/combined.log | cut -d' ' -f4 | sort | uniq -c | sort -nr
```

## Summary

This deployment guide provides a comprehensive roadmap for successfully deploying the Ruzizi Hotel Platform to production. Key success factors include:

1. **Thorough Planning**: Complete all pre-deployment checklists
2. **Security First**: Implement all security measures before going live
3. **Monitoring**: Set up comprehensive monitoring from day one
4. **Backup Strategy**: Ensure reliable backup and recovery procedures
5. **Testing**: Thoroughly test all functionality before production launch
6. **Documentation**: Keep deployment and maintenance procedures updated

### Quick Reference Commands

```bash
# Deployment
pm2 restart ruzizi-hotel
sudo nginx -t && sudo systemctl reload nginx

# Monitoring
pm2 status
pm2 logs ruzizi-hotel
tail -f /home/ruzizi/app/logs/combined.log

# Backup
/home/ruzizi/scripts/backup-mongodb.sh
/home/ruzizi/scripts/backup-application.sh

# Health Check
/home/ruzizi/scripts/health-check.sh
```

### Support and Maintenance

- **Monitoring Dashboard**: Set up alerts for critical metrics
- **Regular Updates**: Schedule security updates and patches
- **Performance Reviews**: Monthly performance analysis
- **Backup Verification**: Weekly backup restoration tests
- **Security Audits**: Quarterly security assessments

For additional support or questions, refer to the project documentation or contact the development team.