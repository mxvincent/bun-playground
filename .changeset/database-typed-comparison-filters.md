---
"@package/database": patch
---

`filterArrayWith` compares filter values by the type of the item value: numbers as numbers, dates as timestamps. It compared them as strings, so `greaterThan('age', '9')` missed `age = 10`, and a date filter written without milliseconds matched nothing. A filter value that cannot be parsed as the item type matches nothing.
