export type Register = {
  user?: { id: number; name: string; email: string; password: string };
  message?: string;
  errors?: {
    [key: string]: string[];
  };
};
