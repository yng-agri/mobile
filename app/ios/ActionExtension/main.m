#import <NativeScript/NativeScript.h>

static TNSRuntime* runtime;

__attribute__((constructor))
void initialize() {
    
    extern char startOfMetadataSection __asm("section$start$__DATA$__TNSMetadata");
    [TNSRuntime initializeMetadata:&startOfMetadataSection];
    
    runtime = [[TNSRuntime alloc] initWithApplicationPath:[NSBundle mainBundle].bundlePath];
    TNSRuntimeInspector.logsToSystemConsole = YES;
    [runtime executeModule:@"./action-extension-starter"];
}
