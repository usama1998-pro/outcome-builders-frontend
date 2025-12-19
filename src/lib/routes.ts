const routes = {
  auth: {
    signup: "/user/signup",
    signin: "/user/signin",
    verify: "/user/verify",
  },
  workspace: {
    get: {
      user: "/workspace/user",
      tenant: "/workspace/tenant",
    },
    create: "/workspace",
    delete: (id: number) => `/workspace/${id}`,
  },
  collection: {
    get: {
      user: "/collection/user",
    },
    create: "/collection",
    delete: (id: number) => `/collection/${id}`,
  },
  user: {
    account: "/user/profile",
    tenants: "/user/tenants",
    updateProfile: "/user/profile/update",
  },
  tenant: {
    create: "/tenant",
    details: (id: number) => `/tenant/${id}`,
    overview: "/tenant/overview",
  },
  notes: {
    get: "/note",
    getById: (id: number) => `/note/${id}`,
    create: "/note",
    update: (id: number) => `/note/${id}`,
    delete: (id: number) => `/note/${id}`,
  },
};

export default routes;
