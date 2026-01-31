export interface MockSession {
  id: string;
  deviceName: string;
  deviceType: "mobile" | "desktop";
  lastActive: string;
  location: string;
}

export const MOCK_CURRENT_SESSION: MockSession = {
  id: "current",
  deviceName: "Secludia Desktop",
  deviceType: "desktop",
  lastActive: "Active now",
  location: "New York, US",
};

export const MOCK_OTHER_SESSIONS: MockSession[] = [
  {
    id: "session-1",
    deviceName: "iPhone 15",
    deviceType: "mobile",
    lastActive: "2 hours ago",
    location: "New York, US",
  },
  {
    id: "session-2",
    deviceName: "Chrome on Windows",
    deviceType: "desktop",
    lastActive: "Yesterday",
    location: "Boston, US",
  },
];
