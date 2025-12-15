"use client";


import { Button } from "@/components/ui/button";
import { NotesList } from "@/src/components/List/Notes/NotesList";
import { useParams } from "next/navigation";
import { FaPlus } from "react-icons/fa";
import { useState } from "react";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    // BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useCollectionNotes, useCreateNote } from "@/src/hooks/useNotes";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useForm } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import BlocksLoader from "@/src/components/Loaders/BlocksLoader/BlocksLoader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const createNoteSchema = z.object({
    title: z.string().min(1, "Title is required").max(200, "Title is too long"),
    content: z.string().min(1, "Content is required"),
});

type CreateNoteFormValues = z.infer<typeof createNoteSchema>;
export default function NotesPage() {
    const params = useParams();
    const workspaceId = Array.isArray(params.workspaceId) ? params.workspaceId[0] : params.workspaceId; // workspace id from URL
    const collectionId = Array.isArray(params.collectionId) ? params.collectionId[0] : params.collectionId;

    const { data: notes, isLoading, isError, error, refetch } = useCollectionNotes(Number(collectionId));
    const { mutate: createNote, isPending } = useCreateNote();
    const [open, setOpen] = useState(false);

    const form = useForm<CreateNoteFormValues>({
        resolver: zodResolver(createNoteSchema),
        defaultValues: {
            title: "",
            content: "",
        },
    });

    const onSubmit = (values: CreateNoteFormValues) => {
        createNote(
            {
                title: values.title,
                content: values.content,
                collection_id: Number(collectionId),
            },
            {
                onSuccess: (res) => {
                    if (res?.status) {
                        toast.success(res.message || "Note created successfully!");
                        form.reset();
                        setOpen(false);
                        refetch(); // Refresh the notes list
                    } else {
                        toast.error(res?.message || "Could not create note.");
                    }
                },
                onError: (err: unknown) => {
                    const error = err as { message?: string };
                    toast.error(error?.message || "Request failed, please try again.");
                },
            }
        );
    };



    return (
        <div className="flex flex-col items-center justify-center p-6">
            <Breadcrumb>
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink href="/dashboard/workspaces">Workspaces</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbLink href={`/dashboard/workspaces/${workspaceId}/collections`}>Collections</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbLink href={`/dashboard/workspaces/${workspaceId}/collections/${collectionId}/notes`}>Notes</BreadcrumbLink>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>
            <nav className="sticky top-0 w-[90%] mx-auto self-center px-15 flex justify-between items-center bg-background border-b border-border py-5">
                <input
                    type="text"
                    placeholder="Search..."
                    className="px-4 py-2 border rounded-md w-1/3"
                />

                <AlertDialog open={open} onOpenChange={setOpen}>
                    <AlertDialogTrigger asChild>
                        <Button>
                            <FaPlus className="mr-2" /> New Note
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="max-w-2xl">
                        <AlertDialogHeader>
                            <AlertDialogTitle>Create a new note</AlertDialogTitle>
                            <AlertDialogDescription>
                                Enter a title and content for your new note below.
                            </AlertDialogDescription>
                        </AlertDialogHeader>

                        <form
                            id="create-note-form"
                            onSubmit={form.handleSubmit(onSubmit)}
                            className="space-y-4"
                        >
                            <div>
                                <Label className="pb-3" htmlFor="title">
                                    Title
                                </Label>
                                <Input
                                    id="title"
                                    placeholder="e.g. Meeting Notes"
                                    {...form.register("title")}
                                    aria-invalid={!!form.formState.errors.title}
                                />
                                {form.formState.errors.title && (
                                    <p className="text-sm !text-red-500 mt-1">
                                        {form.formState.errors.title.message}
                                    </p>
                                )}
                            </div>

                            <div>
                                <Label className="pb-3" htmlFor="content">
                                    Content
                                </Label>
                                <Textarea
                                    id="content"
                                    placeholder="Write your note content here..."
                                    rows={8}
                                    {...form.register("content")}
                                    aria-invalid={!!form.formState.errors.content}
                                />
                                {form.formState.errors.content && (
                                    <p className="text-sm !text-red-500 mt-1">
                                        {form.formState.errors.content.message}
                                    </p>
                                )}
                            </div>

                            <AlertDialogFooter>
                                <AlertDialogCancel disabled={isPending}>
                                    Cancel
                                </AlertDialogCancel>
                                <Button
                                    type="submit"
                                    disabled={isPending}
                                    className="ml-2"
                                >
                                    {isPending ? "Creating..." : "Create"}
                                </Button>
                            </AlertDialogFooter>
                        </form>
                    </AlertDialogContent>
                </AlertDialog>


            </nav>

            {isLoading && (
                <div className="w-full h-full flex items-center justify-center p-5">
                    <BlocksLoader />
                </div>
            )}

            {isError && (
                <div className="w-full h-full flex items-center justify-center p-5">
                    <Card className="w-[300px] h-[200px] flex flex-col border border-red-500 text-red-800 shadow-md">
                        <CardHeader className="border-b border-red-800">
                            <CardTitle className="text-lg font-semibold text-red-700">Error</CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 flex items-center justify-center">
                            <p>{error?.message || "Something went wrong."}</p>
                        </CardContent>
                    </Card>
                </div>
            )}

            {notes && notes.length > 0 && (
                <NotesList notes={notes} collection={{ id: Number(collectionId) }} workspace={{ id: Number(workspaceId) }} />
            )}

            {notes && notes.length === 0 && !isLoading && (
                <div className="w-full h-full flex items-center justify-center p-5">
                    <Card className="w-[400px] p-6 text-center">
                        <CardContent className="pt-6">
                            <p className="text-muted-foreground">No notes yet. Create your first one!</p>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}


// const notes = [
//     {
//         id: 1,
//         title: "Notes 1",
//         createdAt: "24 Sep, 2025 at 10:05 PM",
//         createdBy: "usama",
//         description: "This is Notes 1",
//         members: 10,
//         avatarUrl: "https://github.com/shadcn.png",
//         workspaceId: Number(workspaceId),
//         workspaceName: "Workspace"
//     },
//     {
//         id: 2,
//         title: "Notes 2",
//         createdAt: "24 Sep, 2025 at 10:05 PM",
//         createdBy: "usama",
//         description: "This is Notes 2",
//         members: 12,
//         avatarUrl: "https://github.com/shadcn.png",
//         workspaceId: Number(workspaceId),
//         workspaceName: "Workspace"
//     },
//     {
//         id: 3,
//         title: "Notes 3",
//         createdAt: "24 Sep, 2025 at 10:05 PM",
//         createdBy: "usama",
//         description: "This is Notes 3",
//         members: 13,
//         avatarUrl: "https://github.com/shadcn.png",
//         workspaceId: Number(workspaceId),
//         workspaceName: "Workspace"
//     },
//     {
//         id: 4,
//         title: "Notes 4",
//         createdAt: "24 Sep, 2025 at 10:05 PM",
//         createdBy: "usama",
//         description: "This is Notes 4",
//         members: 14,
//         avatarUrl: "https://github.com/shadcn.png",
//         workspaceId: Number(workspaceId),
//         workspaceName: "Workspace"
//     },
//     {
//         id: 5,
//         title: "Notes 5",
//         createdAt: "24 Sep, 2025 at 10:05 PM",
//         createdBy: "usama",
//         description: "This is Notes 5",
//         members: 5,
//         avatarUrl: "https://github.com/shadcn.png",
//         workspaceId: Number(workspaceId),
//         workspaceName: "Workspace"
//     },
//     {
//         id: 6,
//         title: "Notes 6",
//         createdAt: "24 Sep, 2025 at 10:05 PM",
//         createdBy: "usama",
//         description: "This is Notes 6",
//         members: 3,
//         avatarUrl: "https://github.com/shadcn.png",
//         workspaceId: Number(workspaceId),
//         workspaceName: "Workspace"
//     },
//     {
//         id: 7,
//         title: "Notes 7",
//         createdAt: "24 Sep, 2025 at 10:05 PM",
//         createdBy: "usama",
//         description: "This is Notes 7",
//         members: 4,
//         avatarUrl: "https://github.com/shadcn.png",
//         workspaceId: Number(workspaceId),
//         workspaceName: "Workspace"
//     },
//     {
//         id: 8,
//         title: "Notes 8",
//         createdAt: "24 Sep, 2025 at 10:05 PM",
//         createdBy: "usama",
//         description: "This is Notes 8",
//         members: 6,
//         avatarUrl: "https://github.com/shadcn.png",
//         workspaceId: Number(workspaceId),
//         workspaceName: "Workspace"
//     }
// ];
