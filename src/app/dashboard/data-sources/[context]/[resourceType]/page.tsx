import { notFound } from "next/navigation";
import ResourceListPage from "../../_components/ResourceListPage";
import { isDataContextSlug, isResourceTypeId } from "../../_components/dataContextConfig";

type PageProps = {
  params: Promise<{ context: string; resourceType: string }>;
};

export default async function DataSourceResourceListRoute({ params }: PageProps) {
  const { context, resourceType } = await params;

  if (!isDataContextSlug(context) || !isResourceTypeId(resourceType)) {
    notFound();
  }

  return <ResourceListPage contextSlug={context} resourceTypeId={resourceType} />;
}
