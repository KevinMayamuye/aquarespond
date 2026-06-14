import { useEffect, useRef } from "react";

import SelectWithOther from "./SelectWithOther";

import {
  resolveSelectWithOther,
  validateSelectWithOther,
} from "../utils/resolveSelectWithOther";

const SERVICE_TYPE_OPTIONS = [
  "Repairs",
  "Installation",
  "Maintenance",
];

const BookingForm = ({
  selectedPlumber,
  onSubmit,
  submitting,
  initialValues = null,
  formRef,
}) => {
  const addressRef = useRef(null);
  const notesRef = useRef(null);

  useEffect(() => {
    if (!initialValues) return;

    if (addressRef.current) {
      addressRef.current.value =
        initialValues.address || "";
    }

    if (notesRef.current) {
      notesRef.current.value =
        initialValues.notes || "";
    }
  }, [initialValues, selectedPlumber?._id]);

  const handleSubmit = (e) => {
    e.preventDefault();

    const form = new FormData(e.target);
    const choice = form.get("serviceTypeChoice");
    const custom = form.get("serviceTypeCustom");

    const validationError =
      validateSelectWithOther(choice, custom);

    if (validationError) {
      alert(validationError);
      return;
    }

    const serviceType = resolveSelectWithOther(
      choice,
      custom
    );

    onSubmit({
      plumberId: selectedPlumber._id,
      scheduledAt: form.get("scheduledAt"),
      serviceType,
      address: form.get("address"),
      notes: form.get("notes"),
    });
  };

  if (!selectedPlumber) {
    return (
      <p className="book-hint">
        Select a plumber to continue.
      </p>
    );
  }

  return (
    <form
      ref={formRef}
      className="booking-form"
      onSubmit={handleSubmit}
    >
      <h3>
        Book {selectedPlumber.username}
      </h3>

      <label>
        Date & time
        <input
          type="datetime-local"
          name="scheduledAt"
          required
        />
      </label>

      <SelectWithOther
        key={`${selectedPlumber._id}-${initialValues?.serviceType ?? "new"}`}
        label="Service type"
        options={SERVICE_TYPE_OPTIONS}
        defaultValue={
          initialValues?.serviceType || ""
        }
        selectName="serviceTypeChoice"
        customName="serviceTypeCustom"
        otherPlaceholder="Describe the service..."
        required
      />

      <label>
        Address
        <input
          ref={addressRef}
          type="text"
          name="address"
          placeholder="Street address"
          defaultValue={
            initialValues?.address || ""
          }
          required
        />
      </label>

      <label>
        Notes
        <textarea
          ref={notesRef}
          name="notes"
          rows={3}
          placeholder="Describe the issue (optional)"
          defaultValue={
            initialValues?.notes || ""
          }
        />
      </label>

      <button
        type="submit"
        disabled={submitting}
      >
        {submitting
          ? "Requesting..."
          : "Request booking"}
      </button>
    </form>
  );
};

export default BookingForm;
