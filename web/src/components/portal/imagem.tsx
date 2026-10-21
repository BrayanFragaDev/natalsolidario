import Image, { type ImageProps } from 'next/image';

// O otimizador do Next recusa endereços locais; as imagens do emulador vão sem otimização.
export function ImagemRemota(props: ImageProps & { src: string }) {
  return <Image {...props} alt={props.alt} unoptimized={props.src.startsWith('http://127.0.0.1')} />;
}
