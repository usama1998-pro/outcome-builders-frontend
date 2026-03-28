const routes = {
  auth: {
    signup: "/user/signup",
    signin: "/user/signin",
    verify: "/user/verify",
    forgotPassword: "/user/forgot-password",
    resetPassword: "/user/reset-password",
    twoFAVerify: "/user/2fa/verify",
    twoFAToggle: "/user/2fa/toggle",
    twoFAStatus: "/user/2fa/status",
    twoFAResend: "/user/2fa/resend",
    verifyEmail: "/user/verify-email",
    resendVerification: "/user/resend-verification",
  },
  workspace: {
    get: {
      user: "/workspace/user",
      tenant: "/workspace/tenant",
    },
    create: "/workspace",
    delete: (id: number) => `/workspace/${id}`,
    assignments: (tenantId: number, userId: number) =>
      `/workspace/assignments/${tenantId}/${userId}`,
    updateAssignments: (tenantId: number) =>
      `/workspace/assignments/${tenantId}`,
    assignFromInvitation: "/workspace/assign-from-invitation",
    joinWithToken: "/workspace/join-with-token",
  },
  collection: {
    get: {
      user: "/collection/user",
      users: "/collection/users",
    },
    create: "/collection",
    update: (id: number) => `/collection/${id}`,
    delete: (id: number) => `/collection/${id}`,
    members: (id: number) => `/collection/${id}/members`,
    addMember: (id: number) => `/collection/${id}/members`,
    removeMember: (id: number, userId: number) =>
      `/collection/${id}/members/${userId}`,
  },
  user: {
    account: "/user/profile",
    tenants: "/user/tenants",
    updateProfile: "/user/profile",
    createRole: "/user/role",
    updateRole: "/user/role",
    permissions: "/user/permissions",
    myPermissions: (tenantId: number) => `/user/my-permissions/${tenantId}`,
    customRoles: (tenantId: number) => `/user/custom-roles/${tenantId}`,
    customRole: (tenantId: number, roleId: number) =>
      `/user/custom-roles/${tenantId}/${roleId}`,
    invite: (tenantId: number) => `/user/invite/${tenantId}`,
    removeMember: (tenantId: number, userId: number) =>
      `/user/member/${tenantId}/${userId}`,
    updateMember: (tenantId: number, userId: number) =>
      `/user/member/${tenantId}/${userId}`,
    invitations: (tenantId: number) => `/user/invitations/${tenantId}`,
    resendInvitation: (tenantId: number, invitationId: number) =>
      `/user/invitations/${tenantId}/${invitationId}/resend`,
    deleteInvitation: (tenantId: number, invitationId: number) =>
      `/user/invitations/${tenantId}/${invitationId}`,
    sendWorkspaceTokens: (tenantId: number, invitationId: number) =>
      `/user/invitations/${tenantId}/${invitationId}/send-tokens`,
    settings: "/user/settings",
    updateSettings: "/user/settings",
  },
  tenant: {
    create: "/tenant",
    details: (id: number) => `/tenant/${id}`,
    overview: "/tenant/overview",
    analytics: "/tenant/analytics/overview",
  },
  notes: {
    get: "/note",
    getById: (idOrUuid: number | string) => `/note/${idOrUuid}`,
    create: "/note",
    update: (id: number) => `/note/${id}`,
    delete: (id: number) => `/note/${id}`,
    train: (id: number) => `/note/${id}/train`,
    share: (id: number) => `/note/${id}/share`,
    unshare: (id: number) => `/note/${id}/share`,
    move: (id: number) => `/note/${id}/move`,
  },
  chat: {
    tabs: "/chat/tabs",
    search: "/chat/tabs/search",
    createTab: "/chat/tab",
    updateTab: (chatTabId: string) => `/chat/tab/${chatTabId}`, // UUID as string
    history: (chatTabId: string) => `/chat/tab/${chatTabId}/history`, // UUID as string
    stream: "/chat/stream",
    stop: "/chat/stop",
    delete: (chatTabId: string) => `/chat/tab/${chatTabId}`, // UUID as string
  },
  knowledgeBase: {
    search: "/knowledge-base/search",
  },
  businessContext: {
    createNote: "/business-context/notes",
    createMediaSource: "/business-context/media-sources",
    listNotes: "/business-context/notes",
    deleteNotesBulk: "/business-context/notes",
    listMediaSources: "/business-context/media-sources",
    updateNote: (id: number) => `/business-context/notes/${id}`,
    updateMediaSource: (id: number) => `/business-context/media-sources/${id}`,
    trainNote: (id: number) => `/business-context/notes/${id}/train`,
    trainMediaSource: (id: number) => `/business-context/media-sources/${id}/train`,
    deleteNote: (id: number) => `/business-context/notes/${id}`,
    deleteMediaSourcesBulk: "/business-context/media-sources",
    deleteMediaSource: (id: number) => `/business-context/media-sources/${id}`,
  },
};

export default routes;
