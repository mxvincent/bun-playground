---
"@package/database": patch
---

`createAuthors` spreads the authors over every gender. It picked the gender from the number of authors, so every author of a dataset had the same gender.
