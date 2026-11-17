import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { PageHeader } from "./PageHeader";

export function NotFoundPage() {
  return (
    <PageHeader
      title="Page not found"
      description={
        <>
          There is nothing at this address. Check the link, or go back to the catalogue.
          <span className="mt-4 block">
            <Button asChild>
              <Link to="/">Go to tracks</Link>
            </Button>
          </span>
        </>
      }
    />
  );
}
