// import { create } from "zustand";

// type AppState = {
//   selectedApp: string;
//   setSelectedApp: (app: string) => void;
// };

// // Important for determinate what app is selected (load diferent routes).
// export const useAppSelectedStateStore = create<AppState>((set) => ({
//   selectedApp: "appPartners",
//   setSelectedApp: (app) => set({ selectedApp: app })
// }));

import { create } from "zustand";

type State = {
  selectedApp: string | null;
  setSelectedApp: (app: string) => void;
};

export const useAppSelectedStateStore = create<State>((set) => ({
  selectedApp: typeof window !== "undefined" ? localStorage.getItem("selectedApp") : null,
  setSelectedApp: (app: string) => {
    app = "appGeneral"; // TODO: Remove this before demo.
    if (typeof window !== "undefined") {
      localStorage.setItem("selectedApp", app);
    }
    set({ selectedApp: app });
  }
}));
