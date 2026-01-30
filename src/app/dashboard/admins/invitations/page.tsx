"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/src/store/useAuth";
import api from "@/src/lib/axios";
import routes from "@/src/lib/routes";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Mail, RefreshCw, Key, Clock, CheckCircle2, XCircle } from "lucide-react";
// Format date helper
function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return "N/A";
  }
}

interface Invitation {
  id: number;
  email: string;
  role_name: string;
  invitation_token: string;
  invitation_expires: string;
  invited_by: number;
  invited_by_email: string | null;
  workspace_ids: number[] | null;
  workspace_joining_tokens: Record<string, string> | null;
  created_at: string;
  used: boolean;
  is_expired: boolean;
}

async function fetchInvitations(tenantId: number): Promise<Invitation[]> {
  const { data } = await api.get(routes.user.invitations(tenantId));
  return data.data;
}

async function resendInvitation(tenantId: number, invitationId: number): Promise<{ message: string }> {
  const { data } = await api.post(routes.user.resendInvitation(tenantId, invitationId));
  return data.data;
}

async function sendWorkspaceTokens(tenantId: number, invitationId: number): Promise<{ message: string }> {
  const { data } = await api.post(routes.user.sendWorkspaceTokens(tenantId, invitationId));
  return data.data;
}

export default function InvitationsPage() {
  const tenantId = useAuthStore((s) => s.tenantId);
  const queryClient = useQueryClient();

  const { data: invitations, isLoading, error } = useQuery<Invitation[]>({
    queryKey: ["invitations", tenantId],
    queryFn: () => fetchInvitations(tenantId!),
    enabled: !!tenantId,
  });

  const resendMutation = useMutation({
    mutationFn: ({ invitationId }: { invitationId: number }) =>
      resendInvitation(tenantId!, invitationId),
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: ["invitations", tenantId] });
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.detail || "Failed to resend invitation";
      toast.error(errorMessage);
    },
  });

  const sendTokensMutation = useMutation({
    mutationFn: ({ invitationId }: { invitationId: number }) =>
      sendWorkspaceTokens(tenantId!, invitationId),
    onSuccess: (data) => {
      toast.success(data.message);
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.detail || "Failed to send workspace tokens";
      toast.error(errorMessage);
    },
  });

  if (!tenantId) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-gray-500">Please select an organization to view invitations.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-gray-500">Loading invitations...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-red-500">Failed to load invitations. Please try again.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Invitations</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          View and manage invitations sent to join your organization
        </p>
      </div>

      {!invitations || invitations.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-gray-500 text-center">No invitations found.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {invitations.map((invitation) => (
            <Card key={invitation.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      {invitation.email}
                      {invitation.used ? (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Used
                        </Badge>
                      ) : invitation.is_expired ? (
                        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                          <XCircle className="w-3 h-3 mr-1" />
                          Expired
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          <Clock className="w-3 h-3 mr-1" />
                          Pending
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="mt-2">
                      Role: <span className="font-medium">{invitation.role_name}</span>
                      {invitation.invited_by_email && (
                        <> • Invited by: {invitation.invited_by_email}</>
                      )}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Created</p>
                      <p className="font-medium">
                        {invitation.created_at ? formatDate(invitation.created_at) : "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Expires</p>
                      <p className="font-medium">
                        {invitation.invitation_expires ? formatDate(invitation.invitation_expires) : "N/A"}
                      </p>
                    </div>
                  </div>

                  {invitation.workspace_ids && invitation.workspace_ids.length > 0 && (
                    <div>
                      <p className="text-sm text-gray-500 mb-2">
                        Workspaces: {invitation.workspace_ids.join(", ")}
                      </p>
                      {invitation.workspace_joining_tokens && (
                        <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                          <p className="text-xs text-gray-500 mb-2">Workspace Joining Tokens:</p>
                          <div className="space-y-1">
                            {Object.entries(invitation.workspace_joining_tokens).map(([wsId, token]) => (
                              <div key={wsId} className="text-xs font-mono bg-white dark:bg-gray-900 p-2 rounded border">
                                <span className="text-gray-600 dark:text-gray-400">WS {wsId}: </span>
                                <span className="text-gray-900 dark:text-gray-100">{token}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    {!invitation.used && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => resendMutation.mutate({ invitationId: invitation.id })}
                        disabled={resendMutation.isPending}
                      >
                        <Mail className="w-4 h-4 mr-2" />
                        {resendMutation.isPending ? "Sending..." : "Resend Invitation"}
                      </Button>
                    )}
                    {invitation.workspace_joining_tokens && Object.keys(invitation.workspace_joining_tokens).length > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => sendTokensMutation.mutate({ invitationId: invitation.id })}
                        disabled={sendTokensMutation.isPending}
                      >
                        <Key className="w-4 h-4 mr-2" />
                        {sendTokensMutation.isPending ? "Sending..." : "Send Workspace Tokens"}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

