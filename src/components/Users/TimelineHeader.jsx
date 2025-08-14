// COMPONENT: TimelineHeader.js
import { ArrowLeft } from "lucide-react";
import { Button } from "@mui/material";

export default function TimelineHeader({ date, onBack }) {
  return (
    <div className="flex items-center justify-between mb-6">
      <Button variant="contained" startIcon={<ArrowLeft />} onClick={onBack}>
        Back{" "}
      </Button>
    </div>
  );
}
