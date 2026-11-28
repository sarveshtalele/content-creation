// Cut the person out of a photo (macOS Vision, offline). Used by: studio.py brand --photo FILE.  usage: cutout IN OUT.png
import Vision; import CoreImage; import AppKit
let a = CommandLine.arguments; let inURL = URL(fileURLWithPath: a[1])
let ci = CIImage(contentsOf: inURL)!
let req = VNGenerateForegroundInstanceMaskRequest()
let h = VNImageRequestHandler(ciImage: ci)
try h.perform([req])
guard let r = req.results?.first else { print("no subject"); exit(1) }
let buf = try r.generateMaskedImage(ofInstances: r.allInstances, from: h, croppedToInstancesExtent: false)
let out = CIImage(cvPixelBuffer: buf)
let ctx = CIContext()
try ctx.writePNGRepresentation(of: out, to: URL(fileURLWithPath: a[2]), format: .RGBA8, colorSpace: CGColorSpace(name: CGColorSpace.sRGB)!)
print("ok")
