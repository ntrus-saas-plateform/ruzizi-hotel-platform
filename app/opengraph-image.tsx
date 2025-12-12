import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const alt = 'Ruzizi Hôtel - Hébergement de Luxe au Burundi'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#faf8f5',
          backgroundImage: 'linear-gradient(45deg, #d4af37 0%, #f4e4a6 100%)',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '24px',
            padding: '60px',
            margin: '40px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          }}
        >
          <h1
            style={{
              fontSize: '72px',
              fontWeight: 'bold',
              color: '#2c1810',
              textAlign: 'center',
              marginBottom: '20px',
              fontFamily: 'system-ui',
            }}
          >
            Ruzizi Hôtel
          </h1>
          <p
            style={{
              fontSize: '32px',
              color: '#d4af37',
              textAlign: 'center',
              marginBottom: '30px',
              fontFamily: 'system-ui',
            }}
          >
            Hébergement de Luxe au Burundi
          </p>
          <p
            style={{
              fontSize: '24px',
              color: '#6b5b47',
              textAlign: 'center',
              maxWidth: '800px',
              lineHeight: '1.4',
              fontFamily: 'system-ui',
            }}
          >
            Découvrez l'excellence de l'hospitalité burundaise
          </p>
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}