// components/SearchAndFilters.jsx
import { TextField, Autocomplete } from "@mui/material";

const SearchAndFilters = ({ 
  searchTerm, 
  onSearchChange, 
  users, 
  selectedUsers, 
  onMultiSelectChange 
}) => {
  return (
    <div className="mb-4 flex gap-4 items-center">
      <TextField
        label="Search by name"
        size="small"
        variant="outlined"
        // value={searchTerm}
        onKeyUp={onSearchChange}
      />

      <Autocomplete
        multiple
        options={users}
        getOptionLabel={(option) => option.name}
        value={users.filter((user) => selectedUsers.includes(user.id))}
        onChange={(event, newValue) => onMultiSelectChange(newValue)}
        size="small"
        renderInput={(params) => (
          <TextField {...params} label="Select users to toggle" />
        )}
        sx={{
          minWidth: 300,
          maxWidth: 300,
          "& .MuiAutocomplete-inputRoot": { 
            flexWrap: "nowrap",
            maxWidth: "100%",
            overflow: "hidden",
          },
          "& .MuiAutocomplete-input": {
            minWidth: "30px !important", 
          },
          "& .MuiAutocomplete-tag": {
            maxWidth: 80,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          },
          "& .MuiAutocomplete-inputRoot.MuiOutlinedInput-root": {
            minHeight: "40px",
            maxHeight: "40px",
            alignItems: "center",
          },
        }}
        limitTags={3}
        getLimitTagsText={(more) => `+${more} more`}
      />
    </div>
  );
};

export default SearchAndFilters;