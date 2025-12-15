const routes = {
  auth: {
    signup: "/user/signup",
    signin: "/user/signin",
    verify: "/user/verify",
  },
  workspace: {
    get: {
      user: "/workspace/get/user",
      tenant: "/workspace/get/tenant",
    },
    create: "/workspace/create",
    delete: (id: number) => `/workspace/delete/${id}`,
  },
  collection: {
    get: {
      user: "/collection/get/user",
    },
    create: "/collection/create",
    delete: (id: number) => `/collection/delete/${id}`,
  },
  user: {
    account: "/user/profile",
    tenants: "/user/tenants",
    updateProfile: "/user/profile/update",
  },
  tenant: {
    create: "/tenant/register",
    details: (id: number) => `/tenant/${id}`,
  },
  notes: {
    get: "/notes/get",
    create: "/notes/create",
    delete: "/notes/delete",
  },
};

export default routes;
