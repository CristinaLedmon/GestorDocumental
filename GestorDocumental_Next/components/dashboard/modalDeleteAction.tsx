import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface ModalDeleteActionProps {
  isDialogOpen: boolean;
  setIsDialogOpen: (open: boolean) => void;
  handleDelete: (id: string | undefined) => Promise<void> | void;
  id: string | undefined;
}

export default function ModalDeleteAction({
  isDialogOpen,
  setIsDialogOpen,
  handleDelete,
  id
}: ModalDeleteActionProps) {
  const [loading, setLoading] = useState(false);
  const handleDeleteClick = async () => {
    setLoading(true);
    await handleDelete(String(id));
    setLoading(false);
    setIsDialogOpen(false);
  };
  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>¿Está seguro de querer realizar esta acción?</DialogTitle>
          <DialogDescription>
            Tenga en cuenta que esto supone la eliminación por completo de todos los datos
            relacionados.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button disabled={loading} variant="destructive" size="sm" onClick={handleDeleteClick}>
            {loading ? "Eliminando..." : "Eliminar"}
          </Button>
          <Button variant="link" size="sm" onClick={() => setIsDialogOpen(false)}>
            Cancelar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
