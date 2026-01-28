import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowRight } from "lucide-react";

export interface Change {
  original: string;
  corrected: string;
  explanation: string;
  status?: "pending" | "accepted" | "ignored";
}

interface ChangeLogTableProps {
  changes: Change[];
}

const ChangeLogTable = ({ changes }: ChangeLogTableProps) => {
  if (changes.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p className="text-lg font-medium text-success mb-1">Perfect! 🎉</p>
        <p className="text-sm">No corrections needed in your text.</p>
      </div>
    );
  }

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="w-[30%] font-semibold">Original</TableHead>
            <TableHead className="w-[30%] font-semibold">Corrected</TableHead>
            <TableHead className="font-semibold">Explanation</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {changes.map((change, index) => (
            <TableRow key={index} className="animate-fade-in">
              <TableCell className="font-medium">
                <span className="inline-flex items-center gap-2 flex-wrap">
                  <span className="change-original">
                    {change.original}
                  </span>
                </span>
              </TableCell>
              <TableCell>
                <span className="inline-flex items-center gap-2 flex-wrap">
                  <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0 hidden sm:block" />
                  <span className="change-corrected">
                    {change.corrected}
                  </span>
                </span>
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {change.explanation}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default ChangeLogTable;
