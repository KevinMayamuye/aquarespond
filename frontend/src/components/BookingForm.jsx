import { useEffect, useRef } from "react";

const BookingForm = ({
  selectedPlumber,
  onSubmit,
  submitting,
  initialValues = null,
  formRef,
}) => {
  const serviceTypeRef = useRef(null);
  const addressRef = useRef(null);
  const notesRef = useRef(null);

  useEffect(() => {
    if (!initialValues) return;

    if (serviceTypeRef.current) {
      serviceTypeRef.current.value =
        initialValues.serviceType || "";
    }

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

    onSubmit({
      plumberId: selectedPlumber._id,
      scheduledAt: form.get("scheduledAt"),
      serviceType: form.get("serviceType"),
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

      <label>
        Service type
        <input
          ref={serviceTypeRef}
          type="text"
          name="serviceType"
          placeholder="e.g. Leak repair"
          defaultValue={
            initialValues?.serviceType || ""
          }
          required
        />
      </label>

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
