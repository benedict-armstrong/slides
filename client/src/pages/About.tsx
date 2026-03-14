import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function About() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
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
