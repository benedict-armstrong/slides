import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function About() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-3xl">
        <CardContent className="pt-6 space-y-6">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">About Presio</h1>
            <p className="text-sm text-muted-foreground">
              A simple tool for presenting PDFs remotely.
            </p>
          </div>

          <div className="space-y-4 text-sm text-muted-foreground">
            <div className="space-y-1">
              <h2 className="text-base font-medium text-foreground">How it works</h2>
              <ol className="list-decimal list-inside space-y-1">
                <li>Upload a PDF presentation on the home page.</li>
                <li>You are redirected to the controller view where you can navigate slides.</li>
                <li>Share the 6-character session code with your audience.</li>
                <li>Viewers enter the code on the home page and see your slides in real time.</li>
              </ol>
            </div>

            <div className="space-y-1">
              <h2 className="text-base font-medium text-foreground">Details</h2>
              <ul className="list-disc list-inside space-y-1">
                <li>Slide changes are synced instantly via WebSockets.</li>
                <li>The controller has keyboard shortcuts (arrow keys, spacebar).</li>
                <li>Anyone can download the PDF from the presentation view.</li>
                <li>Presentations automatically expire after 24 hours.</li>
              </ul>
            </div>
          </div>

          <div className="space-y-4 text-sm text-muted-foreground">
            <div className="space-y-1">
              <h2 className="text-base font-medium text-foreground">Speaker Notes</h2>
              <p>
                Presio can display speaker notes embedded in your PDF as link annotations.
                The controller view has a toggleable notes panel that renders markdown.
              </p>
            </div>

            <div className="space-y-1">
              <h3 className="text-sm font-medium text-foreground">Typst</h3>
              <p>Add a helper function to your document and call it on each slide:</p>
              <pre className="bg-muted rounded-md p-3 overflow-x-auto text-xs font-mono whitespace-pre">{`// Define the speaker-notes function
#let speaker-notes(notes) = context {
  // 1. Get the current page number to ensure a unique filename per slide
  let page-num = counter(page).display()
  let filename = "notes-slide-" + page-num + ".json"

  // 2. Structure the data as a dictionary and encode it to a JSON string
  let note-data = (
    slide: page-num,
    notes: notes,
  )
  let json-string = json.encode(note-data)

  // 3. Attach the JSON file to the PDF
  pdf.attach(
    filename,
    bytes(json-string), // Pass the raw bytes of the JSON string
    description: "Speaker notes for slide " + page-num,
    mime-type: "application/json",
  )
}
`}</pre>
            </div>

            Example usage:
            <br />
            <pre className="bg-muted rounded-md p-3 overflow-x-auto text-xs font-mono whitespace-pre">{`#speaker-notes("Remember to mention the demo.")`}</pre>

            <div className="space-y-1">
              <h3 className="text-sm font-medium text-foreground">LaTeX (hyperref)</h3>
              <p>Use the <code className="bg-muted px-1 rounded text-xs">hyperref</code> package to create an invisible link:</p>
              <pre className="bg-muted rounded-md p-3 overflow-x-auto text-xs font-mono whitespace-pre">{`\\usepackage{hyperref}

\\newcommand{\\speakernote}[1]{%
  \\href{note:#1}{\\phantom{n}}%
}

% Usage on a slide:
\\speakernote{Remember to mention the demo.}
`}</pre>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <Button variant="outline" asChild>
              <Link to="/">Back to Home</Link>
            </Button>
            <a
              href="https://github.com/benedict-armstrong/slides"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors underline underline-offset-4"
            >
              GitHub
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
