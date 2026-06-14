import { useState } from "react";

import {
  OTHER_VALUE,
  parseSelectWithOtherDefault,
} from "../utils/resolveSelectWithOther";

const SelectWithOther = ({
  label,
  options,
  defaultValue = "",
  selectName,
  customName,
  otherPlaceholder = "Please specify...",
  required = false,
}) => {
  const parsed = parseSelectWithOtherDefault(
    defaultValue,
    options
  );

  const [choice, setChoice] = useState(
    parsed.choice
  );
  const [custom, setCustom] = useState(
    parsed.custom
  );

  const showOther = choice === OTHER_VALUE;

  return (
    <div className="select-with-other">
      <label>
        {label}
        <select
          name={selectName}
          value={choice}
          onChange={(e) =>
            setChoice(e.target.value)
          }
          required={required}
        >
          <option value="">Select...</option>

          {options.map((option) => (
            <option
              key={option}
              value={option}
            >
              {option}
            </option>
          ))}

          <option value={OTHER_VALUE}>
            Other
          </option>
        </select>
      </label>

      {showOther && (
        <label>
          Please specify
          <input
            type="text"
            name={customName}
            value={custom}
            onChange={(e) =>
              setCustom(e.target.value)
            }
            placeholder={otherPlaceholder}
            required={required}
          />
        </label>
      )}
    </div>
  );
};

export default SelectWithOther;
