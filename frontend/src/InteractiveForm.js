// InteractiveForm.js
import React from "react";
import { useForm } from "react-hook-form";

export function InteractiveForm({ onSubmit }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      style={{ maxWidth: 320, margin: "auto", textAlign: "left" }}
    >
      <div style={{ marginBottom: 10 }}>
        <label>Typ grupy:</label>
        <select {...register("typGrupy", { required: true })} defaultValue="">
          <option value="" disabled>
            Wybierz...
          </option>
          <option value="pojedynczy">Pojedynczy</option>
          <option value="gang">Gang</option>
        </select>
        {errors.typGrupy && (
          <p style={{ color: "red" }}>Wybierz typ grupy</p>
        )}
      </div>

      {/* Przykład pola zależnego */}
      <div style={{ marginBottom: 10 }}>
        <label>Rozmiar gangu:</label>
        <select {...register("gangSize")} defaultValue="">
          <option value="" disabled>
            Wybierz...
          </option>
          <option value="mala">Mała</option>
          <option value="srednia">Średnia</option>
          <option value="duza">Duża</option>
        </select>
      </div>
    </form>
  );
}