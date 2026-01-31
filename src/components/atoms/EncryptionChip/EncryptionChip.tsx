import { memo } from "react";
import { LockFill, LockOpenFill } from "@gravity-ui/icons";
import { Chip } from "@heroui/react";
import { useAppContext } from "@/context";
import type { EncryptionChipProps } from "./EncryptionChip.types";

export const EncryptionChip = memo(function EncryptionChip({ isEncrypted }: EncryptionChipProps) {
  const { t } = useAppContext();

  if (isEncrypted) {
    return (
      <Chip
        color="success"
        size="sm"
        className="rounded-lg border border-success bg-transparent px-2"
      >
        <LockFill className="size-3" />
        {t("CHAT_ENCRYPTED")}
      </Chip>
    );
  }

  return (
    <Chip color="danger" size="sm" className="rounded-lg border border-danger bg-transparent px-2">
      <LockOpenFill className="size-3" />
      {t("CHAT_NOT_ENCRYPTED")}
    </Chip>
  );
});
