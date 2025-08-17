export type Album = {
  id: string;
  name: string;
  release_date: string;
  images: { url: string; width: number; height: number }[];
  external_urls: { spotify: string };
  artists: { id: string; name: string }[];
};

export type Artist = {
  id: string;
  name: string;
  image: string;
};

export type DropItem = {
  id: string;
  name: string;
  image: string;
  type: "artist" | "album";
};
