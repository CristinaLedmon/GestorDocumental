export type Permission = {
  id?: string;
  name: string;
};

export type PermissionFormActions = {
  id: string;
  message: string;
  errors?: {
    [key: string]: string[];
  };
};
