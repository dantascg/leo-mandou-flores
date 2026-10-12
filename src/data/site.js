// Dados soltos, fáceis de editar sem caçar dentro dos componentes.
export const SITE = {
  releaseYear: 2026,
  instagramHandle: "@leomandouflores",
  instagramUrl: "https://instagram.com/leomandouflores",

  // STREAMING: troque "href" pelo link real de cada plataforma quando
  // tiver. O ícone de cada uma vem de public/streaming/<icon>.svg —
  // pra trocar o desenho do ícone, basta substituir o arquivo com o
  // MESMO NOME (não precisa mexer em código nenhum).
  streaming: [
    { name: "Spotify", href: "#", icon: "/streaming/spotify.svg" },
    { name: "Apple Music", href: "#", icon: "/streaming/apple-music.svg" },
    { name: "YouTube Music", href: "#", icon: "/streaming/youtube.svg" },
    { name: "SoundCloud", href: "#", icon: "/streaming/soundcloud.svg" },
  ],
};
