"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Edit, Save, X } from "lucide-react";
import { useState, useEffect } from "react";
import { useUserProfile } from "@/src/hooks/useProfile";
import { useUpdateProfile } from "@/src/hooks/useUpdateProfile";
import { formatDate } from "@/src/utils/dateTimeFormat";
import { FaGithub, FaInstagram, FaLinkedin, FaTwitch, FaTwitter, FaYoutube } from "react-icons/fa";
import RequireAuth from "@/src/components/auth/requireAuth";

export default function DashboardProfile() {
    const { data, isLoading } = useUserProfile();
    const { mutate: updateProfile, isPending } = useUpdateProfile();
    const [isEditing, setIsEditing] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        full_name: "",
        description: "",
        profile_picture: "",
        linkedin: "",
        twitter: "",
        instagram: "",
        github: "",
        twitch: "",
        youtube: "",
    });

    // Update form data when profile data loads
    useEffect(() => {
        if (data?.data) {
            setFormData({
                full_name: data.data.full_name || "",
                description: data.data.description || "",
                profile_picture: data.data.profile_picture || "",
                linkedin: data.data.linkedin || "",
                twitter: data.data.twitter || "",
                instagram: data.data.instagram || "",
                github: data.data.github || "",
                twitch: data.data.twitch || "",
                youtube: data.data.youtube || "",
            });
        }
    }, [data]);

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = () => {
        updateProfile(formData, {
            onSuccess: () => {
                setIsEditing(false);
            }
        });
    };

    const handleCancel = () => {
        // Reset form data to original values
        if (data?.data) {
            setFormData({
                full_name: data.data.full_name || "",
                description: data.data.description || "",
                profile_picture: data.data.profile_picture || "",
                linkedin: data.data.linkedin || "",
                twitter: data.data.twitter || "",
                instagram: data.data.instagram || "",
                github: data.data.github || "",
                twitch: data.data.twitch || "",
                youtube: data.data.youtube || "",
            });
        }
        setIsEditing(false);
    };

    if (isLoading) {
        return (
            <RequireAuth>
                <div className="w-full h-full flex items-center justify-center p-6">
                    <p>Loading...</p>
                </div>
            </RequireAuth>
        );
    }

    return (
        <RequireAuth>
            <div className="w-full h-full flex flex-col items-center justify-center p-6 gap-3">
                <div className="w-full border-b-2 border-dashed pb-4 mb-4 flex justify-between items-center">
                    <p className="text-3xl font-bold flex items-center gap-2">
                        <User className="h-8 w-8 text-[#DB2B30]" />
                        Profile
                    </p>
                    <div className="flex gap-2 items-center">
                        {!isEditing ? (
                            <Button
                                onClick={() => setIsEditing(true)}
                                className="bg-gradient-to-r from-[#DB2B30] to-red-700 text-white border-0"
                            >
                                <Edit className="h-4 w-4 mr-2" />
                                Edit Profile
                            </Button>
                        ) : (
                            <>
                                <Button
                                    onClick={handleSave}
                                    disabled={isPending}
                                    className="bg-gradient-to-r from-[#DB2B30] to-red-700 text-white border-0"
                                >
                                    <Save className="h-4 w-4 mr-2" />
                                    {isPending ? "Saving..." : "Save"}
                                </Button>
                                <Button variant="outline" onClick={handleCancel} disabled={isPending}>
                                    <X className="h-4 w-4 mr-2" />
                                    Cancel
                                </Button>
                            </>
                        )}
                    </div>
                </div>

                <div className="w-full h-full flex flex-row justify-between space-y-6 gap-3">
                    <Card className="w-[50%] h-full flex flex-col items-center justify-center">
                        <CardContent className="pt-6 space-y-4 w-full">
                            <div className="w-full flex items-center justify-center flex-col gap-2">
                                {isEditing ? (
                                    <div className="w-full space-y-2">
                                        <Label htmlFor="full_name">Full Name</Label>
                                        <Input
                                            id="full_name"
                                            value={formData.full_name}
                                            onChange={(e) => handleInputChange("full_name", e.target.value)}
                                            placeholder="Enter your full name"
                                        />
                                    </div>
                                ) : (
                                    <h1 className="font-bold">{data?.data.full_name || "No name set"}</h1>
                                )}
                                <p>{data?.data.email}</p>
                                <p className="text-[#DB2B30]">Premium</p>
                            </div>

                            <div className="w-full flex flex-col items-center justify-center">
                                <Avatar className="w-32 h-32 mb-4 border-gray-700 border-2">
                                    <AvatarImage src={formData.profile_picture || ""} alt="Profile Picture" />
                                    <AvatarFallback>
                                        <User className="w-20 h-20" />
                                    </AvatarFallback>
                                </Avatar>

                                {isEditing && (
                                    <div className="w-full space-y-2">
                                        <Label htmlFor="profile_picture">Profile Picture URL</Label>
                                        <Input
                                            id="profile_picture"
                                            value={formData.profile_picture}
                                            onChange={(e) => handleInputChange("profile_picture", e.target.value)}
                                            placeholder="https://example.com/image.jpg"
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="w-full flex flex-col items-center justify-center">
                                <p className="font-bold">Joined On</p>
                                <p>{formatDate(data?.data.created_at || "")}</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="w-full">
                        <CardHeader>
                            <CardTitle>Bio</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {isEditing ? (
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => handleInputChange("description", e.target.value)}
                                    className="w-full h-[35vh] border-2 rounded p-4"
                                    placeholder="Write something about yourself..."
                                />
                            ) : (
                                <div className="w-full h-[35vh] border-2 rounded p-4 overflow-auto">
                                    {data?.data.description || "No bio added yet."}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <Card className="w-full">
                    <CardHeader>
                        <CardTitle>Social Media Links</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isEditing ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="linkedin">LinkedIn</Label>
                                    <Input
                                        id="linkedin"
                                        value={formData.linkedin}
                                        onChange={(e) => handleInputChange("linkedin", e.target.value)}
                                        placeholder="https://linkedin.com/in/username"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="twitter">Twitter</Label>
                                    <Input
                                        id="twitter"
                                        value={formData.twitter}
                                        onChange={(e) => handleInputChange("twitter", e.target.value)}
                                        placeholder="https://twitter.com/username"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="instagram">Instagram</Label>
                                    <Input
                                        id="instagram"
                                        value={formData.instagram}
                                        onChange={(e) => handleInputChange("instagram", e.target.value)}
                                        placeholder="https://instagram.com/username"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="github">GitHub</Label>
                                    <Input
                                        id="github"
                                        value={formData.github}
                                        onChange={(e) => handleInputChange("github", e.target.value)}
                                        placeholder="https://github.com/username"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="twitch">Twitch</Label>
                                    <Input
                                        id="twitch"
                                        value={formData.twitch}
                                        onChange={(e) => handleInputChange("twitch", e.target.value)}
                                        placeholder="https://twitch.tv/username"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="youtube">YouTube</Label>
                                    <Input
                                        id="youtube"
                                        value={formData.youtube}
                                        onChange={(e) => handleInputChange("youtube", e.target.value)}
                                        placeholder="https://youtube.com/@username"
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="w-full flex flex-wrap gap-4">
                                {formData.linkedin && (
                                <a
                                    href={formData.linkedin}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 px-4 py-2 bg-[#0A66C2] text-white rounded-lg hover:bg-[#004182] transition-colors"
                                >
                                    <FaLinkedin className="h-5 w-5" />
                                    <span>LinkedIn</span>
                                </a>
                                )}
                                {formData.twitter && (
                                <a
                                    href={formData.twitter}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 px-4 py-2 bg-[#1DA1F2] text-white rounded-lg hover:bg-[#0d8ae5] transition-colors"
                                >
                                    <FaTwitter className="h-5 w-5" />
                                    <span>Twitter</span>
                                </a>
                                )}
                                {formData.instagram && (
                                    <a
                                        href={formData.instagram}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 text-white rounded-lg hover:from-purple-600 hover:via-pink-600 hover:to-red-600 transition-colors"
                                    >
                                        <FaInstagram className="h-5 w-5" />
                                        <span>Instagram</span>
                                    </a>
                                )}
                                {formData.github && (
                                    <a
                                        href={formData.github}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors"
                                    >
                                        <FaGithub className="h-5 w-5" />
                                        <span>GitHub</span>
                                    </a>
                                )}
                                {formData.twitch && (
                                    <a
                                        href={formData.twitch}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                                    >
                                        <FaTwitch className="h-5 w-5" />
                                        <span>Twitch</span>
                                    </a>
                                )}
                                {formData.youtube && (
                                    <a
                                        href={formData.youtube}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                                    >
                                        <FaYoutube className="h-5 w-5" />
                                        <span>YouTube</span>
                                    </a>
                                )}
                                {!formData.linkedin && !formData.twitter && !formData.instagram &&
                                    !formData.github && !formData.twitch && !formData.youtube && (
                                        <p className="text-sm text-muted-foreground italic">
                                            No social media links added yet. Click "Edit Profile" to add them.
                                        </p>
                                    )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </RequireAuth>
    );
}
