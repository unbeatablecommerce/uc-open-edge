# File Drop Demo

Place JSON files in the configured file-drop inbox folder.
The file-drop connector will pick them up, process them, and move them to `processed/`.

## Sample event files

See `events/` directory for sample JSON files you can drop into the inbox.

## Setup

1. Create a file-drop connector in the admin UI with `inboxPath` pointing to a local folder
2. Copy sample files from `events/` to the inbox
3. Events appear in UC Open Edge within the poll interval
