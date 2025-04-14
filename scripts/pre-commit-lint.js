#!/usr/bin/env node

import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';

// Log that we're starting
console.log('Running pre-commit hook...');

try {
  // Get all staged files using git diff --staged instead
  console.log('Checking for staged files...');
  const stagedFiles = execSync('git diff --staged --name-only')
    .toString()
    .trim()
    .split('\n')
    .filter(Boolean);

  console.log(`Found ${stagedFiles.length} staged files.`);

  if (stagedFiles.length === 0) {
    console.log('No staged files to lint');
    process.exit(0);
  }

  // Filter for files we want to process and check that they exist
  const filesToLint = stagedFiles.filter((file) => {
    const extensions = ['.js', '.jsx', '.ts', '.tsx', '.json', '.css', '.md'];
    // Only include files that have valid extensions AND still exist (not deleted)
    return extensions.some((ext) => file.endsWith(ext)) && existsSync(file);
  });

  console.log(`Found ${filesToLint.length} files to format.`);

  if (filesToLint.length === 0) {
    console.log('No matching files to lint');
    process.exit(0);
  }

  // Process files in batches to avoid memory issues
  const BATCH_SIZE = 3; // Process 3 files at a time
  for (let i = 0; i < filesToLint.length; i += BATCH_SIZE) {
    const batch = filesToLint.slice(i, i + BATCH_SIZE);
    console.log(`Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(filesToLint.length / BATCH_SIZE)}: ${batch.join(', ')}`);

    // Run prettier on the batch of files
    const fileList = batch.join(' ');
    execSync(`bun prettier --write ${fileList}`, { stdio: 'inherit' });

    // Add the formatted files back to staging
    execSync(`git add ${fileList}`, { stdio: 'inherit' });
  }

  console.log('Pre-commit linting completed successfully');
  process.exit(0);
} catch (error) {
  console.error('Error during pre-commit linting:', error.message);
  process.exit(1);
}
