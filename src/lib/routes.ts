const routes = {
  auth: {
    signup: "/user/signup",
    signin: "/user/signin",
    verify: "/user/verify",
  },
  workspace: {
    get: {
      user: "/workspace/get/user",
      tenant: "/workspace/get/tenant"
    },

    create: "/workspace/create",
  },
  user: {
    account: "/user/profile",
  },
  tenant: {
    create: "/tenants/create",
  },
};

export default routes;
