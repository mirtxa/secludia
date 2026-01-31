import type { RoomType } from "@/context";

export interface MockRoom {
  id: number;
  name: string;
  image?: string;
  type: RoomType;
}

export const MOCK_ROOMS: MockRoom[] = [
  {
    id: 1,
    name: "Work",
    image: "https://img.heroui.chat/image/avatar?w=200&h=200&u=2",
    type: "space",
  },
  {
    id: 2,
    name: "Friends",
    image: "https://img.heroui.chat/image/avatar?w=200&h=200&u=3",
    type: "space",
  },
  { id: 3, name: "Gaming", type: "space" },
  {
    id: 4,
    name: "Project Alpha",
    image: "https://img.heroui.chat/image/avatar?w=200&h=200&u=5",
    type: "group",
  },
  {
    id: 5,
    name: "Book Club",
    image: "https://img.heroui.chat/image/avatar?w=200&h=200&u=6",
    type: "group",
  },
  { id: 6, name: "Family", type: "group" },
];
