export type Login = {
  user: { id: number; name: string; email: string };
  message: string;
  errors?: {
    [key: string]: string[];
  };
};
