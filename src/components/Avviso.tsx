import React, { useState } from "react";

type AvvisoProps = {
    title?: string;
    message?: string;
    dismissible?: boolean;
    onClose?: () => void;
    className?: string;
};

export function Avviso({
                                  title = "Attenzione",
                                  message = "Se si sono verificati problemi durante il caricamento o l’inserimento delle richieste , esci e rientra dall’applicazione per continuare.",
                                  dismissible = true,
                                  onClose,
                                  className = "",
                              }: AvvisoProps) {
    const [visible, setVisible] = useState(true);

    if (!visible) return null;

    const handleClose = () => {
        setVisible(false);
        onClose?.();
    };

    return (
        <div
            role="alert"
            aria-live="assertive"
            aria-atomic="true"
            className={className}
            style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "12px",
                padding: "16px",
                borderRadius: "12px",
                border: "1px solid #f5c26b",
                background: "#fff8e6",
                color: "#6b4e16",
                boxShadow: "0 4px 14px rgba(0,0,0,0.08)",
            }}
        >
            <div
                aria-hidden="true"
                style={{
                    flexShrink: 0,
                    width: "20px",
                    height: "20px",
                    marginTop: "2px",
                }}
            >
                ⚠️
            </div>

            <div style={{ flex: 1 }}>
                <div
                    style={{
                        fontWeight: 700,
                        marginBottom: "4px",
                        fontSize: "14px",
                    }}
                >
                    {title}
                </div>

                <div
                    style={{
                        fontSize: "14px",
                        lineHeight: 1.5,
                    }}
                >
                    {message}
                </div>
            </div>

            {dismissible && (
                <button
                    type="button"
                    onClick={handleClose}
                    aria-label="Chiudi avviso"
                    style={{
                        flexShrink: 0,
                        border: "none",
                        background: "transparent",
                        color: "#6b4e16",
                        cursor: "pointer",
                        fontSize: "18px",
                        lineHeight: 1,
                        padding: "2px 4px",
                    }}
                >
                    ×
                </button>
            )}
        </div>
    );
}