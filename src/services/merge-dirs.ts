import { existsSync } from 'fs'
import fs from 'fs/promises'

import path from 'path'

export const conflictResolvers = {
    ask: 'ask',
    skip: 'skip',
    overwrite: 'overwrite'
}

const copyFile = async (file: string, location: string) => {
    await fs.mkdir(file.split('/').slice(0, -1).join('/'), {
        recursive: true
    })
    await fs.writeFile(file, await fs.readFile(location))
}

export default async function mergeDirs(src: string, dest: string) {
    const files = await fs.readdir(src)

    const ops = files.map(async (file) => {
        const srcFile = `${src}/${file}`
        const destFile = `${dest}/${file}`

        const stats = await fs.lstat(srcFile)

        if (stats.isDirectory()) return await mergeDirs(srcFile, destFile)
        if (existsSync(destFile)) return

        copyFile(destFile, srcFile)
    })

    await Promise.all(ops)
}
