export type User = {
  id?: string;
  name: string;
  email: string;
  password?: string;
  role?: string;
};

export type UserFormActions = {
  id: string;
  message: string;
  errors?: {
    [key: string]: string[];
  };
};
