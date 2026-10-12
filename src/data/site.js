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
    { name: "Spotify", href: "https://open.spotify.com/intl-pt/artist/0H1Vd2f6hQTru3k1nHl6O2?si=Tk6IjQ61SOK2Mzvdiwjz0w", icon: "/streaming/spotify.png" },
    { name: "Apple Music", href: "https://music.apple.com/us/song/i-remain-the-same/1729937841", icon: "/streaming/apple-music.png" },
    { name: "YouTube Music", href: "https://www.youtube.com/@leonandradej/videos", icon: "/streaming/youtube.png" },
    { name: "SoundCloud", href: "https://soundcloud.com/leonandradej/tracks", icon: "/streaming/soundcloud.png" },
  ],
};
