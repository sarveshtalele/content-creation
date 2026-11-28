# How code reaches production

A release moves through a pipeline, one stop at a time.

First, a developer pushes a commit. The push starts the pipeline.

Next, the build step compiles the code and runs the unit tests.

Then the security scan checks the dependencies for known problems.

After that, the staging deploy releases the build to a safe copy of production.

Finally, the production release ships the build to users, and monitoring watches the result.
