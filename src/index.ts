import globby from 'globby'
import fs from 'fs'
import path from 'path'

export const getAbsolutePath = (url: string) => {
	// 使用 path.join() 将 baseUrl 和 url 连接成绝对路径
	const absolutePath = path.join(process.cwd(), url)
	// 返回绝对路径
	return absolutePath
}

export function isTemplateComponent(code: string): boolean {
	return code.includes('<template>') && code.includes('</template>')
}

export interface FileOptions {
	/**
	 * 是否开启调试模式。
	 * 调试模式会在控制台打印输出调试信息。
	 * 这是一个可选属性，默认值为 false。
	 */
	debug?: boolean

	/**
	 * 一个包含文件执行模式（glob patterns）的数组。
	 * 这是
	debug?: boolean
	/**
	 * 路由的名称。这是一个可选属性，如果未提供，默认值为 'layout'。
	 */
	name?: string

	/**
	 * 路由的基础URL。这是一个可选属性，如果未提供，默认值为 './src'。
	 */
	baseUrl?: string
	/**
	 * 一个包含文件执行模式（glob patterns）的数组。
	 * 这是一个可选属性，默认值为['./src/views/**\/*.vue']。
	 */
	include?: string[]

	/**
	 * 一个包含文件忽略模式（glob patterns）的数组。
	 * 这是一个可选属性，如果未提供，默认为空数组。
	 */
	ignore?: string[]
}
export async function createRequiredComponent(options: FileOptions = {}) {
	const {debug = false, name = 'layout', baseUrl = './src', include = ['./src/views/**/*.vue'], ignore = []} = options
	const option = {
		debug,
		name: name,
		baseUrl,
		include,
		ignore: ignore.map((s) => getAbsolutePath(s.replace(/\//g, '\\')))
	}
	const files = await globby(option.include)
	const absolutePaths = files
		.map((file: any) => {
			return fs.realpathSync(file)
		})
		.filter((v: any) => {
			// console.log(option.ignore.includes(v))
			return !option.ignore.some((s) => v.includes(s))
		})
	if (option.debug) {
		console.log(option, absolutePaths)
	}
	return {
		name: 'vite-plugin-required-component',
		enforce: 'pre',
		async transform(code: string, id: string) {
			if (id.endsWith('.vue')) {
				if (absolutePaths.includes(id.replace(/\//g, '\\'))) {
					if (isTemplateComponent(code)) {
						const regex = new RegExp(`<${option.name}[^>]*>|</${option.name}>`, 'g')
						const hasComponent = code.match(regex)
						if (!hasComponent) {
							// eslint-disable-next-line @typescript-eslint/ban-ts-comment
							// @ts-ignore
							this.error(`【${id}】必须包含${option.name}组件`)
						}
					}
				}
			}
		}
	}
}
