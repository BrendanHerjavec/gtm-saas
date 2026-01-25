"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Mail, Phone, Building2, Trash2, Edit } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { formatDate, getInitials } from "@/lib/utils";
import { deleteLead, convertLeadToContact, LeadStatus, LeadSource } from "@/actions/leads";
import { useToast } from "@/hooks/use-toast";

type Lead = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  company: string | null;
  jobTitle: string | null;
  source: string;
  status: string;
  createdAt: Date;
  owner: { id: string; name: string | null; email: string | null; image: string | null } | null;
};

interface LeadsTableProps {
  data: {
    leads: Lead[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

const statusColors: Record<string, "default" | "secondary" | "success" | "warning" | "destructive"> = {
  NEW: "default",
  CONTACTED: "secondary",
  QUALIFIED: "success",
  UNQUALIFIED: "destructive",
  CONVERTED: "success",
};

const sourceLabels: Record<string, string> = {
  WEBSITE: "Website",
  REFERRAL: "Referral",
  LINKEDIN: "LinkedIn",
  COLD_OUTREACH: "Cold Outreach",
  EVENT: "Event",
  ADVERTISING: "Advertising",
  OTHER: "Other",
};

export function LeadsTable({ data }: LeadsTableProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await deleteLead(deleteId);
      toast({ title: "Lead deleted successfully" });
      router.refresh();
    } catch {
      toast({ variant: "destructive", title: "Failed to delete lead" });
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  const handleConvert = async (leadId: string) => {
    try {
      await convertLeadToContact(leadId);
      toast({ title: "Lead converted to contact" });
      router.refresh();
    } catch {
      toast({ variant: "destructive", title: "Failed to convert lead" });
    }
  };

  if (data.leads.length === 0) {
    return (
      <div className="flex h-96 flex-col items-center justify-center text-center">
        <Mail className="h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">No leads found</h3>
        <p className="text-muted-foreground">
          Get started by adding your first lead
        </p>
      </div>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Company</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Source</TableHead>
            <TableHead>Owner</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.leads.map((lead) => (
            <TableRow key={lead.id}>
              <TableCell>
                <Link
                  href={`/leads/${lead.id}`}
                  className="font-medium hover:underline"
                >
                  {lead.firstName || lead.lastName
                    ? `${lead.firstName || ""} ${lead.lastName || ""}`.trim()
                    : "Unknown"}
                </Link>
                {lead.jobTitle && (
                  <p className="text-sm text-muted-foreground">{lead.jobTitle}</p>
                )}
              </TableCell>
              <TableCell>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1 text-sm">
                    <Mail className="h-3 w-3" />
                    {lead.email}
                  </div>
                  {lead.phone && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Phone className="h-3 w-3" />
                      {lead.phone}
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                {lead.company && (
                  <div className="flex items-center gap-1">
                    <Building2 className="h-3 w-3" />
                    {lead.company}
                  </div>
                )}
              </TableCell>
              <TableCell>
                <Badge variant={statusColors[lead.status] || "default"}>
                  {lead.status.replace("_", " ")}
                </Badge>
              </TableCell>
              <TableCell>
                <span className="text-sm">{sourceLabels[lead.source] || lead.source}</span>
              </TableCell>
              <TableCell>
                {lead.owner && (
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={lead.owner.image || ""} />
                      <AvatarFallback className="text-xs">
                        {getInitials(lead.owner.name || "")}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{lead.owner.name}</span>
                  </div>
                )}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {formatDate(lead.createdAt)}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/leads/${lead.id}`}>
                        <Edit className="mr-2 h-4 w-4" />
                        View Details
                      </Link>
                    </DropdownMenuItem>
                    {lead.status !== "CONVERTED" && (
                      <DropdownMenuItem onClick={() => handleConvert(lead.id)}>
                        Convert to Contact
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => setDeleteId(lead.id)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {data.pagination.totalPages > 1 && (
        <div className="flex items-center justify-between border-t px-4 py-4">
          <p className="text-sm text-muted-foreground">
            Showing {(data.pagination.page - 1) * data.pagination.limit + 1} to{" "}
            {Math.min(
              data.pagination.page * data.pagination.limit,
              data.pagination.total
            )}{" "}
            of {data.pagination.total} leads
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={data.pagination.page === 1}
              onClick={() => router.push(`/leads?page=${data.pagination.page - 1}`)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={data.pagination.page === data.pagination.totalPages}
              onClick={() => router.push(`/leads?page=${data.pagination.page + 1}`)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Lead</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this lead? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
