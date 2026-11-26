"use client";

import React, { useState } from "react";
import { Icon } from "@/components/ui/Icons";

type PasswordInputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "type">;

export function PasswordInput({ style, ...inputProps }: PasswordInputProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div style={{ position: "relative", width: "100%" }}>
      <input
        {...inputProps}
        type={isVisible ? "text" : "password"}
        style={{ ...style, width: style?.width ?? "100%", paddingRight: "42px" }}
      />
      <button
        type="button"
        aria-label={isVisible ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
        aria-pressed={isVisible}
        title={isVisible ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
        onClick={() => setIsVisible((visible) => !visible)}
        style={{
          position: "absolute",
          top: "50%",
          right: "8px",
          display: "grid",
          width: "28px",
          height: "28px",
          placeItems: "center",
          transform: "translateY(-50%)",
          padding: 0,
          border: 0,
          borderRadius: "6px",
          background: "transparent",
          color: "#64748b",
          cursor: "pointer",
        }}
      >
        <Icon name={isVisible ? "eyeOff" : "eye"} size={17} />
      </button>
    </div>
  );
}
