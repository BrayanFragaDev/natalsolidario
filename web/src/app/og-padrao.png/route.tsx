import { ImageResponse } from 'next/og';

// Imagem de prévia usada quando a publicação não tem capa e não há logo.
export function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#1f5135',
          color: '#fbf7f0',
          fontSize: 72,
          fontWeight: 700,
        }}
      >
        <div style={{ display: 'flex' }}>Grupo Natal Solidário</div>
        <div style={{ display: 'flex', marginTop: 24, height: 8, width: 240, background: '#d4a24c' }} />
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
