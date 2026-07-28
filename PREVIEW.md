# Preview deployments

Every branch pushed to GitHub gets its own live URL from Vercel, separate
from production. Use one to try a change on a real server before it reaches
customers:

    git checkout -b my-change
    # ...edit files...
    git commit -am "try something"
    git push origin my-change

Vercel comments the preview URL on the branch. When it looks right, merge
into main and it goes live. If it looks wrong, delete the branch and nothing
ever touched the real store.
