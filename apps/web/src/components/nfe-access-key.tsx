"use client";

import { formatNfeAccessKey } from "@/lib/format-nfe-access-key";

interface IAccessKey {
  accessKey: string;
}

export function NfeAccessKey({ accessKey }: IAccessKey) {
  return (
    <div>
      {formatNfeAccessKey(accessKey).map((block, index) => (
        <span className="mr-0.5 md:mr-[3px]" key={index}>
          {block}
        </span>
      ))}
    </div>
  );
}
