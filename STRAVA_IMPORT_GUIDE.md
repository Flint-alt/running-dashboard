# Strava Import Guide

How to export your runs from Strava and import them into the Running Dashboard.

---

## Step 1: Export your data from Strava

1. Log in to Strava on the web (strava.com)
2. Click your profile picture (top right) → **Settings**
3. In the left sidebar click **My Account**
4. Scroll down to **Download or Delete Your Account**
5. Click **Get Started** under "Download Request (optional)"
6. Click **Request Your Archive**
7. Strava will email you a download link (usually within a few minutes)
8. Download the zip file and extract it

Inside the extracted folder, find the file called **`activities.csv`** — this is the file you need.

---

## Step 2: Import into the Running Dashboard

1. Open the Running Dashboard in your browser
2. Go to the **Dashboard** page
3. Scroll down to the **Data Management** section
4. Click **Import from Strava** (the orange button)
5. Select the `activities.csv` file from your Strava export
6. A confirmation dialog will show how many new runs were found
7. Click **OK** to import

---

## What gets imported

| Strava Field        | Dashboard Field  | Notes                                      |
|---------------------|------------------|--------------------------------------------|
| Activity Date       | Date             | Converted to YYYY-MM-DD                    |
| Distance            | Distance (km)    | Auto-detected metres vs km                 |
| Elapsed Time        | Time             | Stored in seconds                          |
| Average Heart Rate  | Avg HR           | Imported if available                      |
| Activity Name       | Notes            | The name you gave the run in Strava        |
| Activity Type       | —                | Only "Run", "Trail Run", "Virtual Run", and "Treadmill" are imported |

### Run type inference

The dashboard assigns a run type automatically:

| Condition                                          | Assigned Type |
|----------------------------------------------------|---------------|
| Name contains "parkrun" or "park run"              | parkrun       |
| Name contains "interval", "speed", or "track"      | intervals     |
| Name contains "tempo"                              | tempo         |
| Name contains "recovery"                           | recovery      |
| Name contains "long run"                           | long          |
| Distance between 4.8 km and 5.3 km                | parkrun       |
| Distance 8 km or more (no keyword match)           | long          |
| Everything else                                    | easy          |

You can edit any run after import using the **Edit** button on the Dashboard.

---

## Duplicates

The importer checks for existing runs with the same date and a similar distance (within 0.2 km). Duplicates are automatically skipped, so it is safe to re-import the same file multiple times.

---

## Troubleshooting

**"No running activities found"**
Make sure you selected `activities.csv` and not another file from the export.

**Some runs have the wrong type**
The type is inferred from the activity name and distance. Edit the run manually after import to correct it.

**Runs show no training week**
Runs recorded before your training plan start date (Jan 5, 2026) will have no week assigned. This is expected.

**Distance looks wrong**
Strava can export distance in either metres or kilometres depending on your account settings. The importer handles both automatically. If a value still looks off, edit the run manually.
