Built using

# node-typescript-boilerplate

Github link: https://github.com/jsynowiec/node-typescript-boilerplate

To run right now:

```sh
npx tsx main.ts
```

This will copy all the files from the alat_files folder to the database.

--

To do: Use the COPY command

In order to run:

This is the supabase template for connecting to the supabase database.

```sh
psql "sslmode=verify-full sslrootcert=/path/to/prod-supabase.cer host=[CLOUD_PROVIDER]-0-[REGION].pooler.supabase.com dbname=postgres user=postgres.[PROJECT_REF]"
```

This connects to the PT-Backend-Dev database.

This is currently working on PT-Backend-Dev,

credentials for those are.

[CLOUD_PROVIDER] = aws
[REGION] = ap-southeast-2
[PROJECT_REF] = lkxwausyseuiizopsrwi

So for PT-Backend-Dev, the command is:

```sh
psql "sslmode=verify-full sslrootcert=./ssl-cert/prod-ca-2021.crt host=aws-0-ap-southeast-2.pooler.supabase.com dbname=postgres user=postgres.lkxwausyseuiizopsrwi"
```
