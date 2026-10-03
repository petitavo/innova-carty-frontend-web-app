export interface User {
  id: number;
  email: string;
  fullName: string;
  role: string;
  storeId: number;
  token: string;
}

export interface SignInRequest {
  email: string;
  password: string;
}

export function initials(fullName: string): string {
  return fullName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
}
