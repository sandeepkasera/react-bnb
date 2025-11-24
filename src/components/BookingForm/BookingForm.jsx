import * as PropTypes from 'prop-types';
import { useParams } from 'react-router';
import './BookingForm.scss';
import { useRef, useState, useEffect } from 'react';
import LoadingImg from '../../assets/loading.gif';
import { ApiUtil } from '../../lib/apiUtil';
import { applyDateMask } from '../../lib/inputMaskUtil';

// Track the current request ID to handle stale responses
let currentRequestId = 0;

function handleCheckinDateChange(checkinDateElem, setCheckinDate) {
  const formattedDateStr = applyDateMask(checkinDateElem);
  setCheckinDate(formattedDateStr);
}

/**
 * Checks the availability of the requested dates when the "Check-in date" or "Duration of stay" change.
 * The availability should only be checked if checkinDate matches the yyyy-mm-dd format and the user has stopped
 * typing for 500ms.
 * When the availability of the dates is determined hide/show the availability error message (by calling
 * setShowAvailabilityError()) only if checkinDate and duration haven't changed since the "checkAvailability" request
 * was sent. e.g. if the user changes the duration a second time while the code is waiting for the API to respond from
 * the first change, then ignore the API response
 * @param {string} propertyId - ID of the property
 * @param {string} checkinDate - Value of the "Check-in date" input
 * @param {string} durationString - Value of the "Duration of stay" input
 * @param {function} setShowAvailabilityError - Function that takes a boolean input and shows/hides the availability error message.
 */
export function onRequestedDatesChange(
  propertyId,
  checkinDate,
  durationString,
  setShowAvailabilityError
) {
  // Validate date format: yyyy-mm-dd
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(checkinDate)) {
    return;
  }

  // Convert duration to number, default to 1 if empty
  const duration = durationString ? parseInt(durationString, 10) : 1;

  // Increment request ID to track this request
  const requestId = ++currentRequestId;

  // Clear any existing timeout and set a new one with 500ms debounce
  if (onRequestedDatesChange.timeoutId !== undefined) {
    clearTimeout(onRequestedDatesChange.timeoutId);
  }

  onRequestedDatesChange.timeoutId = setTimeout(() => {
    ApiUtil.checkAvailability(propertyId, checkinDate, duration).then((isAvailable) => {
      // Only process response if this is still the current request
      if (requestId === currentRequestId) {
        setShowAvailabilityError(!isAvailable);
      }
    });
  }, 500);
}

const BookingForm = ({ rate }) => {
  let { propertyId } = useParams();
  const [checkinDate, setCheckinDate] = useState('');
  const [duration, setDuration] = useState('');
  const [guests, setGuests] = useState('');
  const [showAvailabilityError, setShowAvailabilityError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const checkinDateRef = useRef(null);
  const formRef = useRef(null);

  /**
   * Form Improvements Made:
   * 1. Validation: Check all required fields are filled and have valid format
   * 2. Error Handling: Display specific error messages for different failure scenarios
   * 3. Success Feedback: Show confirmation message after successful reservation
   * 4. Loading State: Disable form and show loading indicator during API call
   * 5. Accessibility: Added aria-labels, aria-describedby, aria-live regions for status updates
   * 6. HTML Best Practices: Use semantic form elements with proper labels, input types, required attributes
   * 7. User Experience: Clear messages, disable submit if availability check failed, auto-clear messages
   */
  function submitBooking(e) {
    e.preventDefault();

    // Clear previous messages
    setErrorMessage('');
    setSuccessMessage('');

    // Validate inputs
    if (!checkinDate || !duration || !guests) {
      setErrorMessage('Please fill in all fields.');
      return;
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(checkinDate)) {
      setErrorMessage('Check-in date must be in yyyy-mm-dd format.');
      return;
    }

    // Validate duration is a positive number
    const durationNum = parseInt(duration, 10);
    if (isNaN(durationNum) || durationNum <= 0) {
      setErrorMessage('Duration must be a positive number of days.');
      return;
    }

    // Validate guests is a positive number
    const guestsNum = parseInt(guests, 10);
    if (isNaN(guestsNum) || guestsNum <= 0) {
      setErrorMessage('Number of guests must be a positive number.');
      return;
    }

    // If availability error is shown, prevent submission
    if (showAvailabilityError) {
      setErrorMessage('The specified dates are not available. Please select different dates.');
      return;
    }

    setLoading(true);

    ApiUtil.reserve(propertyId, checkinDate, durationNum, guestsNum)
      .then(() => {
        // Success - show confirmation and reset form
        setSuccessMessage('Reservation successful! Your booking has been confirmed.');
        formRef.current?.reset();
        setCheckinDate('');
        setDuration('');
        setGuests('');
        // Auto-clear success message after 5 seconds
        setTimeout(() => setSuccessMessage(''), 5000);
      })
      .catch((error) => {
        // Handle specific error codes from API
        if (error.response?.status === 400) {
          setErrorMessage(
            error.response?.data?.errorMsg || 'Property is not available for the selected dates.'
          );
        } else if (error.response?.status === 422) {
          setErrorMessage('Invalid input. Please check your entries.');
        } else {
          setErrorMessage('Reservation failed. Please try again later.');
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }

  useEffect(() => {
    setShowAvailabilityError(false);
    onRequestedDatesChange(propertyId, checkinDate, duration, setShowAvailabilityError);
  }, [propertyId, checkinDate, duration]);

  return (
    <form className="booking-form" ref={formRef} onSubmit={submitBooking}>
      <div className="booking-rate-section">
        <span className="booking-rate-amount">${rate}</span>
        <span>/night</span>
      </div>

      {/* Success message with aria-live for screen readers */}
      {successMessage && (
        <div
          className="booking-form-success-msg"
          role="alert"
          aria-live="polite"
          aria-label="Success message"
        >
          {successMessage}
        </div>
      )}

      {/* Error message with aria-live for screen readers */}
      {errorMessage && (
        <div
          className="booking-form-error-msg"
          role="alert"
          aria-live="assertive"
          aria-label="Error message"
        >
          {errorMessage}
        </div>
      )}

      <div className="booking-form-item">
        <label htmlFor="checkin-date">Check-in date</label>
        <input
          id="checkin-date"
          className="booking-form-input"
          onChange={() => handleCheckinDateChange(checkinDateRef.current, setCheckinDate)}
          ref={checkinDateRef}
          placeholder="yyyy-mm-dd"
          type="text"
          required
          aria-required="true"
          aria-describedby={showAvailabilityError ? 'date-error' : undefined}
        />
        {showAvailabilityError && (
          <div className="booking-form-error-msg" id="date-error">
            The specified dates are not available.
          </div>
        )}
      </div>

      <div className="booking-form-item">
        <label htmlFor="duration">Duration of stay (days)</label>
        <input
          id="duration"
          className="booking-form-input"
          type="number"
          min="1"
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          required
          aria-required="true"
        />
      </div>

      <div className="booking-form-item">
        <label htmlFor="guests">Number of guests</label>
        <input
          id="guests"
          className="booking-form-input"
          type="number"
          min="1"
          value={guests}
          onChange={(e) => setGuests(e.target.value)}
          required
          aria-required="true"
        />
      </div>

      <div>
        <button
          className="booking-form-submit"
          type="submit"
          disabled={loading || showAvailabilityError}
          aria-busy={loading}
        >
          {loading ? (
            <>
              <img src={LoadingImg} alt="" className="booking-form-loading-img" />
              <span>Reserving...</span>
            </>
          ) : (
            'Reserve'
          )}
        </button>
      </div>
    </form>
  );
};

BookingForm.propTypes = {
  rate: PropTypes.number,
};

export default BookingForm;
