import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads'
import os from 'node:os'
import { fileURLToPath } from 'node:url'
const __filename = fileURLToPath(import.meta.url)

const min = 2
const max = 1e7
const combinedPrimes = []
const threadsAmount = os.cpus().length
const range = Math.ceil((max - min) / threadsAmount)
console.time("Prime Numbers");
if (isMainThread) {
	const promises = []
	for (let i = 0; i < threadsAmount; i++) {
		const start = min + i * range
		const end = Math.min(max, start + range)
		promises.push(
			new Promise((resolve, reject) => {
				const worker = new Worker(__filename, {
					workerData: { start, end },
				})
				worker.on('message', resolve)
				worker.on('error', reject)
				worker.on('exit', code => {
					if (code !== 0) {
						reject(new Error(`Worker stopped with exit code ${code}`))
					}
				})
			}),
		)
	}
	Promise.allSettled(promises).then(values => {
		for (const promise of values) {
			if (promise.status === 'fulfilled') {
				combinedPrimes.push(...promise.value)
			} else {
				console.log(promise.reason)
			}
		}
		console.log(combinedPrimes)
		console.timeEnd("Prime Numbers");

	})
} else {
	generatePrimes(workerData.start, range)
}

function generatePrimes(start, range) {
	const primes = []
	let isPrime = true
	let end = start + range
	for (let i = start; i < end; i++) {
		for (let j = min; j < Math.sqrt(end); j++) {
			if (i !== j && i % j === 0) {
				isPrime = false
				break
			}
		}
		if (isPrime) {
			primes.push(i)
		}
		isPrime = true
	}
	parentPort.postMessage(primes)
}